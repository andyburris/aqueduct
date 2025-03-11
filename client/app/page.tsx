"use client"

import { JazzAndAuth } from "./common/JazzAndAuth";
import { HomePage } from "./home/HomePage";

export default function Home() {
	return (
		<JazzAndAuth>
			<HomePage/>
		</JazzAndAuth>
	)
}