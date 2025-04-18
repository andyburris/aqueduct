import { GoogleDriveExtension, GoogleDriveFile, Stream, unzipFiles, GooglePhotosExtension, GoogleCredentials, GooglePhotoMetadata } from "aqueduct"
import { GoogleIntegration, GooglePhoto } from "../../jazz/schema/integrations/google-integration"
import { Account, FileStream, Group, ImageDefinition } from "jazz-tools";
import sharp from "sharp"
import convertHEIC from "heic-convert"

const ZIP_MIME_TYPES = [
    "application/zip",
    "application/x-zip-compressed",
    "application/x-zip",
]
export async function syncPhotos(data: GoogleIntegration) {
    console.log("Syncing Google Photos...")

    if(!process.env.GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID not set")
    if(!process.env.GOOGLE_CLIENT_SECRET) throw new Error("GOOGLE_CLIENT_SECRET not set")
    const drive = new GoogleDriveExtension({
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
    const photos = new GooglePhotosExtension()

    const loadedData = await data.ensureLoaded({ resolve: { authentication: {}, files: { items: true }, photos: { items: { $each: { } } } }})

    const takeoutFiles = Stream
        .fromListener<GoogleDriveFile[]>(emit => loadedData.files.items.subscribe({}, (files) => {
            const takeoutFiles = files.filter(f => ZIP_MIME_TYPES.includes(f.mimeType ?? "") && f.name?.startsWith("takeout-"))
            console.log("raw takeout files = ", takeoutFiles.map(f => f.name))
            emit(takeoutFiles)
        }))
        .map(files => files.reduce((acc, f) => {
            const [timestamp, number] = f.name!.split("-").slice(1)
            return acc.set(timestamp, (acc.get(timestamp) ?? []).concat(f))
        }, new Map<string, GoogleDriveFile[]>()))

    const mostRecent = takeoutFiles
        .map(fileGroups => {
            const keys = Array.from(fileGroups.keys())
            const asDates = keys.map(k => new Date(k))
            const mostRecentIndex = asDates.reduce((acc, d, i) => d > asDates[acc] ? i : acc, 0)
            const mostRecentKey = keys[mostRecentIndex]
            return fileGroups.get(mostRecentKey) ?? []
            // return fileGroups.get("20250415T062955Z") ?? []
        })
        .onEach(files => console.log("Most recent takeout files: ", files.map(f => f.name)))

    const driveToken = Stream
        .fromListener<GoogleCredentials | undefined>(emit => loadedData.authentication.subscribe({}, (auth) => {
            emit(auth.credentials)
        }))
        .filter(t => !!t)

    const downloadedAndUnzipped = Stream
        .combine(mostRecent, driveToken)
        .onEach(([files, token]) => console.log(`Downloading ${files.length} takeout files...`))
        .onEach(() => loadedData.photos.lastSyncStarted = new Date())
        .map(([files, token]) => drive.getFilesContent(token, files), 1)
        .onEach(files => console.log(`Downloaded ${files.length} takeout files`))
        .map(files => unzipFiles(files))

    downloadedAndUnzipped
        .onEach(entries => console.log("Parsing takeout photos..."))
        .map(entries => photos.parseTakeoutFiles(entries))
        .onEach(photos => console.log(`Parsed ${photos.length} photos`))
        .listen(async photosWithMetadata => {
            const coValues = await Promise.all(photosWithMetadata.map(async p => {
                console.log("Creating image definition for", p.metadata.title)
                const imageDefinition = await createImage(p.photo, p.metadata, { owner: loadedData._owner})
                console.log(`Created image with resolution: ${imageDefinition.originalSize}`)
                return GooglePhoto.create({
                    metadata: p.metadata,
                    photo: imageDefinition
                }, { owner: loadedData._owner })
            }))
            loadedData.photos.items.applyDiff(coValues)
            loadedData.photos.lastSyncFinished = new Date()
        })
}

export async function createImage(
    imageBlobOrFile: Blob | File,
    metadata: GooglePhotoMetadata,
    options?: {
      owner?: Group | Account;
      maxSize?: 256 | 1024 | 2048;
    },
  ): Promise<ImageDefinition> {  
    const owner = options?.owner;
  
    const buffer = await imageBlobOrFile.arrayBuffer()
    const isHEIC = metadata.title.endsWith(".heic") || metadata.title.endsWith(".HEIC") || metadata.title.endsWith(".HEIF") || metadata.title.endsWith(".heif");
    const converted = isHEIC
        ? await convertHEIC({
            buffer: new Uint8Array(buffer),
            format: "PNG",
        })
        : buffer

    const image = sharp(converted);

    const { width: originalWidth, height: originalHeight } = await image.metadata();
    if(!originalWidth || !originalHeight) {
        throw new Error("Could not get image dimensions");
    }

    const placeholderDataURL = await image
        .toFormat("png")
        .toBuffer()
        .then(buffer => buffer.toString("base64"))
        .then(base64 => `data:image/png;base64,${base64}`)
    const imageDefinition = ImageDefinition.create(
      {
        originalSize: [originalWidth, originalHeight],
        placeholderDataURL,
      },
      owner,
    );
  
    const fillImageResolutions = async () => {  
      if (originalWidth > 256 || originalHeight > 256) {
        const width =
          originalWidth > originalHeight
            ? 256
            : Math.round(256 * (originalWidth / originalHeight));
        const height =
          originalHeight > originalWidth
            ? 256
            : Math.round(256 * (originalHeight / originalWidth));
  
        const max256 = new Blob([await image.resize(width, height).toBuffer()])
        const binaryStream = await FileStream.createFromBlob(max256, owner);
  
        imageDefinition[`${width}x${height}`] = binaryStream;
      }
  
      await new Promise((resolve) => setTimeout(resolve, 0));
  
      if (options?.maxSize === 256) return;
  
  
      if (originalWidth > 1024 || originalHeight > 1024) {
        const width =
          originalWidth > originalHeight
            ? 1024
            : Math.round(1024 * (originalWidth / originalHeight));
        const height =
          originalHeight > originalWidth
            ? 1024
            : Math.round(1024 * (originalHeight / originalWidth));
  
        const max1024 = new Blob([await image.resize(width, height).toBuffer()])
        const binaryStream = await FileStream.createFromBlob(max1024, owner);
  
        imageDefinition[`${width}x${height}`] = binaryStream;
      }
  
      await new Promise((resolve) => setTimeout(resolve, 0));
  
      if (options?.maxSize === 1024) return;
    
      if (originalWidth > 2048 || originalHeight > 2048) {
        const width =
          originalWidth > originalHeight
            ? 2048
            : Math.round(2048 * (originalWidth / originalHeight));
        const height =
          originalHeight > originalWidth
            ? 2048
            : Math.round(2048 * (originalHeight / originalWidth));
  
        const max2048 = new Blob([await image.resize(width, height).toBuffer()])
        const binaryStream = await FileStream.createFromBlob(max2048, owner);
  
        imageDefinition[`${width}x${height}`] = binaryStream;
      }
  
      await new Promise((resolve) => setTimeout(resolve, 0));
  
      if (options?.maxSize === 2048) return;
  
      const originalBinaryStream = await FileStream.createFromBlob(
        new Blob([converted]),
        owner,
      );
  
      imageDefinition[`${originalWidth}x${originalHeight}`] =
        originalBinaryStream;
    };
  
    await fillImageResolutions();
  
    return imageDefinition;
  }
  