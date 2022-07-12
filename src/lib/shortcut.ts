export const shortcut = ( node: HTMLElement, params: {code?: string, default?: boolean, callback? : (...any)=> any}): { update: () => void; destroy: () => void; } => {
	let handler;
	const removeHandler = () => window.removeEventListener('keydown', handler),
		setHandler = () => {
			removeHandler();
			if (!params) return;
			handler = (e) => {
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

