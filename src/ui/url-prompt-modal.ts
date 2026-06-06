import { App, Modal } from 'obsidian';

export function promptForUrl(
	app: App,
	onSubmit: (url: string) => void,
) {
	new UrlPromptModal(app, onSubmit).open();
}

class UrlPromptModal extends Modal {
	private onSubmit: (url: string) => void;

	constructor(app: App, onSubmit: (url: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass('selection-toolbar-url-prompt');

		contentEl.createEl('h2', { text: 'Add link' });

		const form = contentEl.createEl('form');
		const input = form.createEl('input', {
			attr: {
				type: 'url',
				placeholder: 'https://example.com',
			},
		});

		const actions = form.createDiv({
			cls: 'selection-toolbar-url-prompt-actions',
		});
		const cancelButton = actions.createEl('button', {
			text: 'Cancel',
			attr: {
				type: 'button',
			},
		});
		const submitButton = actions.createEl('button', {
			text: 'Apply',
			attr: {
				type: 'submit',
			},
		});
		submitButton.addClass('mod-cta');

		cancelButton.addEventListener('click', () => this.close());
		form.addEventListener('submit', (event) => {
			event.preventDefault();

			const url = input.value.trim();
			if (!url) {
				return;
			}

			this.onSubmit(url);
			this.close();
		});

		input.focus();
	}

	onClose() {
		this.contentEl.empty();
	}
}
