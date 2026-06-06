import { App, Editor, normalizePath, Notice } from 'obsidian';

const FALLBACK_NOTE_TITLE = 'Selection note';

export async function extractSelectionToNote(app: App, editor: Editor) {
	const selection = editor.getSelection();
	const content = selection.trim();

	if (!content) {
		return;
	}

	const { path, title } = getAvailableNotePath(app, content);

	await app.vault.create(path, `${content}\n`);
	editor.replaceSelection(`[[${path.replace(/\.md$/, '')}|${title}]]`);

	new Notice(`Extracted selection to ${title}`);
}

function getAvailableNotePath(app: App, content: string) {
	const activeFile = app.workspace.getActiveFile();
	const folderPath = activeFile?.parent?.path;
	const directory = folderPath && folderPath !== '/' ? folderPath : '';
	const title = getNoteTitle(content);
	let path = buildPath(directory, title);
	let index = 2;

	while (app.vault.getAbstractFileByPath(path)) {
		path = buildPath(directory, `${title} ${index}`);
		index += 1;
	}

	return { path, title };
}

function buildPath(directory: string, title: string) {
	return normalizePath(directory ? `${directory}/${title}.md` : `${title}.md`);
}

function getNoteTitle(content: string) {
	const firstLine =
		content
			.split(/\r?\n/)
			.find((line) => line.trim().length > 0)
			?.trim() ?? FALLBACK_NOTE_TITLE;
	const title = firstLine
		.replace(/[<>:"/\\|?*#^`~]/g, '')
		.replace(/\[|\]/g, '')
		.replace(/\s+/g, ' ')
		.slice(0, 80)
		.trim();

	return title || FALLBACK_NOTE_TITLE;
}
