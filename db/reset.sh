rm -r ./sync-db
bunx jazz-run sync &
sleep 7
bunx jazz-run account create --name "Fountain Server Worker" -p "ws://127.0.0.1:4200"
wait