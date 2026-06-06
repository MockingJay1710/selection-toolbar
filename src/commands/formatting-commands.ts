import { Editor, MarkdownFileInfo, MarkdownView, Plugin } from 'obsidian';
import {
	applyCallout,
	applyMarkdownLink,
	lowercaseSelection,
	titleCaseSelection,
	toggleBold,
	toggleBulletList,
	toggleCodeBlock,
	toggleComment,
	toggleHighlight,
	toggleInlineCode,
	toggleItalic,
	toggleNumberedList,
	toggleQuote,
	toggleStrikethrough,
	toggleTaskList,
	toggleUnderline,
	toggleWikilink,
	uppercaseSelection,
} from '../formatting/markdown-formatting';
import { extractSelectionToNote } from '../notes/extract-selection';
import { promptForUrl } from '../ui/url-prompt-modal';

type EditorCommandHandler = (
	editor: Editor,
	ctx: MarkdownView | MarkdownFileInfo,
) => void | Promise<void>;

export function registerFormattingCommands(plugin: Plugin) {
	addEditorCommand(plugin, 'format-bold', 'Format selection: bold', toggleBold);
	addEditorCommand(
		plugin,
		'format-italic',
		'Format selection: italic',
		toggleItalic,
	);
	addEditorCommand(
		plugin,
		'format-underline',
		'Format selection: underline',
		toggleUnderline,
	);
	addEditorCommand(
		plugin,
		'format-strikethrough',
		'Format selection: strikethrough',
		toggleStrikethrough,
	);
	addEditorCommand(
		plugin,
		'format-highlight',
		'Format selection: highlight',
		toggleHighlight,
	);
	addEditorCommand(
		plugin,
		'format-inline-code',
		'Format selection: inline code',
		toggleInlineCode,
	);
	addEditorCommand(
		plugin,
		'format-wikilink',
		'Format selection: wikilink',
		toggleWikilink,
	);
	addEditorCommand(plugin, 'format-link', 'Format selection: link', (editor) => {
		promptForUrl(plugin.app, (url) => {
			applyMarkdownLink(editor, url);
			editor.focus();
		});
	});
	addEditorCommand(
		plugin,
		'format-comment',
		'Format selection: comment',
		toggleComment,
	);
	addEditorCommand(
		plugin,
		'format-quote-block',
		'Format selection: quote block',
		toggleQuote,
	);
	addEditorCommand(
		plugin,
		'format-bullet-list',
		'Format selection: bullet list',
		toggleBulletList,
	);
	addEditorCommand(
		plugin,
		'format-numbered-list',
		'Format selection: numbered list',
		toggleNumberedList,
	);
	addEditorCommand(
		plugin,
		'format-task-list',
		'Format selection: task list',
		toggleTaskList,
	);
	addEditorCommand(
		plugin,
		'format-code-block',
		'Format selection: code block',
		toggleCodeBlock,
	);
	addEditorCommand(
		plugin,
		'format-callout-note',
		'Format selection: note callout',
		(editor) => applyCallout(editor, 'note'),
	);
	addEditorCommand(
		plugin,
		'format-callout-tip',
		'Format selection: tip callout',
		(editor) => applyCallout(editor, 'tip'),
	);
	addEditorCommand(
		plugin,
		'format-callout-warning',
		'Format selection: warning callout',
		(editor) => applyCallout(editor, 'warning'),
	);
	addEditorCommand(
		plugin,
		'format-uppercase',
		'Format selection: uppercase',
		uppercaseSelection,
	);
	addEditorCommand(
		plugin,
		'format-lowercase',
		'Format selection: lowercase',
		lowercaseSelection,
	);
	addEditorCommand(
		plugin,
		'format-title-case',
		'Format selection: title case',
		titleCaseSelection,
	);
	addEditorCommand(
		plugin,
		'extract-selection-to-note',
		'Extract selection to note',
		(editor) => extractSelectionToNote(plugin.app, editor),
	);
}

function addEditorCommand(
	plugin: Plugin,
	id: string,
	name: string,
	editorCallback: EditorCommandHandler,
) {
	plugin.addCommand({
		id,
		name,
		editorCallback: (editor, ctx) => {
			void editorCallback(editor, ctx);
		},
	});
}
