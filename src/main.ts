import { Plugin } from 'obsidian';
import { registerFormattingCommands } from './commands/formatting-commands';
import { FloatingFormatToolbar } from './ui/floating-format-toolbar';

export default class SelectionToolbarPlugin extends Plugin {
	private formatToolbar!: FloatingFormatToolbar;

	async onload() {
		this.formatToolbar = new FloatingFormatToolbar(this);
		registerFormattingCommands(this);
	}
}
