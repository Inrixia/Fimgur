import { readFile, mkdir, writeFile } from "fs/promises";

const outputDir = "./downloadedImages";
let done = 0;

const go = async () => {
	await mkdir(outputDir, { recursive: true });

	const imgurUrls = (await readFile("./fimfarchive-20230301-imgur.txt"))
		.toString()
		.replaceAll("%2f", "/")
		.split("\n")
		.filter((url) => url !== "" && url !== "/" && url !== "https://i.imgur.com/")
		.flatMap(createImgurUrlArray)
		.map((u) => new URL(u));

	const raw = imgurUrls.filter(filterRaw).map(stripQueryParams);
	const notRaw = imgurUrls.filter(filterNotRaw);

	const dedupedRaw = Array.from(new Set(raw.map((u) => u.href)));

	writeFile(`fimfarchive-20230301-imgur-cleaned.json`, JSON.stringify(dedupedRaw, null, 2));

	// dedupedRaw.map((u) => new URL(u)).map(async (url) => {
	// 	try {
	// 		const response = await got(url, { responseType: "buffer", resolveBodyOnly: false });
	// 		const fileName = response.headers["content-type"] !== undefined ? `${removeAfter(url.pathname, ".")}.${removeBefore(response.headers["content-type"], "/")}` : url.pathname;
	// 		await writeFile(`${outputDir}/${fileName}`, response.body);
	// 		console.log(`${++done}/${dedupedRaw.length}`);
	// 	} catch (err) {
	// 		console.error(err);
	// 	}
	// });
};

go();

const stripQueryParams = (u: URL) => new URL(addPng(`${u.protocol}${u.hostname}${u.pathname}`));
const addPng = (u: string) => (u.lastIndexOf(".") < u.length - 5 ? `${u}.png` : u);
const filterRaw = (u: URL) => u.pathname.lastIndexOf("/") === 0;
const filterNotRaw = (u: URL) => u.pathname.lastIndexOf("/") !== 0;
const removeAfter = (s: string, del: string) => s.substring(0, s.lastIndexOf(del));
const removeBefore = (s: string, del: string) => s.substring(s.indexOf(del) + 1, s.length);

function createImgurUrlArray(inputString: string) {
	if (!inputString.includes(",")) return inputString;

	const urlPattern = /^(https?:\/\/[^\/]+)\/([a-zA-Z0-9,]+)(\/[^#]+)?(#.+)?$/;
	const match = inputString.match(urlPattern);

	if (!match) return inputString;

	const baseUrl = match[1];
	const ids = match[2].split(",");

	const urls = ids.map((id) => `${baseUrl}/${id}`);

	return urls;
}
