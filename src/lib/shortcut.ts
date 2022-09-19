import settings from "./js/settings";
export const spacePlonkShortcut = (node: HTMLElement, params: { code?: string, default?: boolean, callback?: (...any) => any }): { update: () => void; destroy: () => void; } => {
	let handler;
	const removeHandler = () => window.removeEventListener('keydown', handler),
		setHandler = () => {
			removeHandler();
			if (!params) return;
			handler = (e) => {
				// only works if we only have one shortcut

				if (!settings.values.spacePlonking) return
				if (params.code != e.code) return;
				if (!params.default) {
					e.preventDefault();
				}
				params.callback ? params.callback() : node.click();
			};
			window.addEventListener('keydown', handler);
		};
	setHandler();
	return {
		update: setHandler,
		destroy: removeHandler
	};
};

