import { Editor } from 'obsidian';

type Formatter = {
	before: string;
	after: string;
};

type LineTransform = (line: string, nonBlankLineNumber: number) => string;

export function toggleBold(editor: Editor) {
	toggleWrappedSelection(editor, { before: '**', after: '**' });
}

export function toggleItalic(editor: Editor) {
	toggleWrappedSelection(editor, { before: '*', after: '*' });
}

export function toggleStrikethrough(editor: Editor) {
	toggleWrappedSelection(editor, { before: '~~', after: '~~' });
}

export function toggleUnderline(editor: Editor) {
	toggleWrappedSelection(editor, { before: '<u>', after: '</u>' });
}

export function toggleHighlight(editor: Editor) {
	toggleWrappedSelection(editor, { before: '==', after: '==' });
}

export function toggleInlineCode(editor: Editor) {
	toggleWrappedSelection(editor, { before: '`', after: '`' });
}

export function toggleComment(editor: Editor) {
	toggleWrappedSelection(editor, { before: '%%', after: '%%' });
}

export function toggleWikilink(editor: Editor) {
	toggleWrappedSelection(editor, { before: '[[', after: ']]' });
}

export function applyMarkdownLink(editor: Editor, url: string) {
	wrapSelectedBlocks(editor, {
		before: '[',
		after: `](${url})`,
	});
}

export function toggleWrappedSelection(editor: Editor, formatter: Formatter) {
	const selection = editor.getSelection();
	if (!selection) {
		return;
	}

	editor.replaceSelection(formatSelectedBlocks(selection, formatter));
}

export function toggleQuote(editor: Editor) {
	toggleLinePrefix(editor, {
		addPrefix: () => '> ',
		removePattern: /^(\s*)>\s?/,
		isActive: (line) => /^(\s*)>\s?/.test(line),
	});
}

export function toggleBulletList(editor: Editor) {
	toggleLinePrefix(editor, {
		addPrefix: () => '- ',
		removePattern: /^(\s*)- /,
		isActive: (line) => /^(\s*)- (?!\[[ xX]\] )/.test(line),
	});
}

export function toggleNumberedList(editor: Editor) {
	const selection = editor.getSelection();
	if (!selection) {
		return;
	}

	const nonBlankLines = getNonBlankLines(selection);
	const shouldRemove =
		nonBlankLines.length > 0 &&
		nonBlankLines.every((line) => /^(\s*)\d+\.\s+/.test(line));

	if (shouldRemove) {
		editor.replaceSelection(
			transformNonBlankLines(selection, (line) =>
				line.replace(/^(\s*)\d+\.\s+/, '$1'),
			),
		);
		return;
	}

	editor.replaceSelection(
		transformNonBlankLines(selection, (line, lineNumber) =>
			addLinePrefix(line, `${lineNumber}. `),
		),
	);
}

export function toggleTaskList(editor: Editor) {
	toggleLinePrefix(editor, {
		addPrefix: () => '- [ ] ',
		removePattern: /^(\s*)- \[[ xX]\] /,
		isActive: (line) => /^(\s*)- \[[ xX]\] /.test(line),
	});
}

export function toggleCodeBlock(editor: Editor) {
	const selection = editor.getSelection();
	if (!selection) {
		return;
	}

	const leadingWhitespace = selection.match(/^\s*/)?.[0] ?? '';
	const trailingWhitespace = selection.match(/\s*$/)?.[0] ?? '';
	const content = selection.slice(
		leadingWhitespace.length,
		selection.length - trailingWhitespace.length,
	);

	if (!content) {
		return;
	}

	if (content.startsWith('```') && content.endsWith('```')) {
		editor.replaceSelection(
			`${leadingWhitespace}${content
				.replace(/^```\w*\r?\n?/, '')
				.replace(/\r?\n?```$/, '')}${trailingWhitespace}`,
		);
		return;
	}

	editor.replaceSelection(
		`${leadingWhitespace}\`\`\`\n${content}\n\`\`\`${trailingWhitespace}`,
	);
}

export function applyCallout(editor: Editor, type: string) {
	const selection = editor.getSelection();
	if (!selection) {
		return;
	}

	editor.replaceSelection(
		`> [!${type}]\n${transformLines(selection, (line) =>
			line.trim() ? `> ${line}` : '>',
		)}`,
	);
}

export function uppercaseSelection(editor: Editor) {
	replaceSelection(editor, (selection) => selection.toLocaleUpperCase());
}

export function lowercaseSelection(editor: Editor) {
	replaceSelection(editor, (selection) => selection.toLocaleLowerCase());
}

export function titleCaseSelection(editor: Editor) {
	replaceSelection(editor, (selection) =>
		selection.replace(/\p{L}[\p{L}\p{N}'-]*/gu, (word) =>
			`${word.charAt(0).toLocaleUpperCase()}${word
				.slice(1)
				.toLocaleLowerCase()}`,
		),
	);
}

export function formatSelectedBlocks(selection: string, formatter: Formatter) {
	return splitIntoBlocks(selection)
		.map((part) => {
			if (isBlankBlockSeparator(part)) {
				return part;
			}

			return toggleWrappedBlock(part, formatter);
		})
		.join('');
}

function wrapSelectedBlocks(editor: Editor, formatter: Formatter) {
	const selection = editor.getSelection();
	if (!selection) {
		return;
	}

	editor.replaceSelection(
		splitIntoBlocks(selection)
			.map((part) => {
				if (isBlankBlockSeparator(part)) {
					return part;
				}

				return wrapBlock(part, formatter);
			})
			.join(''),
	);
}

function replaceSelection(
	editor: Editor,
	replacer: (selection: string) => string,
) {
	const selection = editor.getSelection();
	if (!selection) {
		return;
	}

	editor.replaceSelection(replacer(selection));
}

function toggleLinePrefix(
	editor: Editor,
	config: {
		addPrefix: (lineNumber: number) => string;
		removePattern: RegExp;
		isActive: (line: string) => boolean;
	},
) {
	const selection = editor.getSelection();
	if (!selection) {
		return;
	}

	const nonBlankLines = getNonBlankLines(selection);
	const shouldRemove =
		nonBlankLines.length > 0 && nonBlankLines.every(config.isActive);

	editor.replaceSelection(
		transformNonBlankLines(selection, (line, lineNumber) => {
			if (shouldRemove) {
				return line.replace(config.removePattern, '$1');
			}

			return addLinePrefix(line, config.addPrefix(lineNumber));
		}),
	);
}

function getNonBlankLines(selection: string) {
	return selection
		.split(/\r?\n/)
		.filter((line) => line.trim().length > 0);
}

function transformNonBlankLines(
	selection: string,
	transform: LineTransform,
) {
	let nonBlankLineNumber = 0;

	return transformLines(selection, (line) => {
		if (!line.trim()) {
			return line;
		}

		nonBlankLineNumber += 1;
		return transform(line, nonBlankLineNumber);
	});
}

function transformLines(
	selection: string,
	transform: (line: string) => string,
) {
	return selection
		.split(/(\r?\n)/)
		.map((part) => {
			if (/^\r?\n$/.test(part)) {
				return part;
			}

			return transform(part);
		})
		.join('');
}

function addLinePrefix(line: string, prefix: string) {
	const leadingWhitespace = line.match(/^\s*/)?.[0] ?? '';

	return `${leadingWhitespace}${prefix}${line.slice(leadingWhitespace.length)}`;
}

function splitIntoBlocks(selection: string) {
	return selection.split(/((?:[^\S\r\n]*(?:\r?\n)){2,}[^\S\r\n]*)/);
}

function isBlankBlockSeparator(value: string) {
	return /^[\s\r\n]*$/.test(value) && /\r?\n/.test(value);
}

function toggleWrappedBlock(block: string, formatter: Formatter) {
	return mapBlockContent(block, (content) => {
		if (isWrapped(content, formatter)) {
			return content.slice(
				formatter.before.length,
				content.length - formatter.after.length,
			);
		}

		return `${formatter.before}${content}${formatter.after}`;
	});
}

function wrapBlock(block: string, formatter: Formatter) {
	return mapBlockContent(
		block,
		(content) => `${formatter.before}${content}${formatter.after}`,
	);
}

function mapBlockContent(
	block: string,
	mapContent: (content: string) => string,
) {
	const leadingWhitespace = block.match(/^\s*/)?.[0] ?? '';
	const trailingWhitespace = block.match(/\s*$/)?.[0] ?? '';
	const content = block.slice(
		leadingWhitespace.length,
		block.length - trailingWhitespace.length,
	);

	if (!content) {
		return block;
	}

	return `${leadingWhitespace}${mapContent(content)}${trailingWhitespace}`;
}

function isWrapped(content: string, formatter: Formatter) {
	return (
		content.startsWith(formatter.before) && content.endsWith(formatter.after)
	);
}
