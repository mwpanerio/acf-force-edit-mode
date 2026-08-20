/**
 * Force the WP 7.1+ block editor canvas out of the iframe.
 *
 * WP 7.1 hardcodes shouldIframe:true in VisualEditor. ACF V2 edit mode needs a
 * non-iframe canvas (TinyMCE/jQuery cannot run inside editor-canvas).
 *
 * Gutenberg uses window.ReactJSXRuntime.jsx/jsxs (not only wp.element.createElement),
 * so those are patched. Load immediately after react-jsx-runtime.
 */
(function () {
	'use strict';

	function withoutIframe( props ) {
		if ( props && typeof props === 'object' && props.shouldIframe === true ) {
			return Object.assign( {}, props, { shouldIframe: false } );
		}
		return props;
	}

	function patchFn( obj, name ) {
		if ( ! obj || typeof obj[ name ] !== 'function' ) {
			return false;
		}
		var original = obj[ name ];
		obj[ name ] = function ( type, props, key ) {
			return original.call( this, type, withoutIframe( props ), key );
		};
		return true;
	}

	function patchAll() {
		var patched = false;
		if ( window.ReactJSXRuntime ) {
			patched = patchFn( window.ReactJSXRuntime, 'jsx' ) || patched;
			patched = patchFn( window.ReactJSXRuntime, 'jsxs' ) || patched;
			patched = patchFn( window.ReactJSXRuntime, 'jsxDEV' ) || patched;
		}
		if ( window.wp && wp.element ) {
			patched = patchFn( wp.element, 'createElement' ) || patched;
			patched = patchFn( wp.element, 'jsx' ) || patched;
			patched = patchFn( wp.element, 'jsxs' ) || patched;
		}
		return patched;
	}

	if ( ! patchAll() ) {
		// Runtime may not be ready yet if this file is loaded standalone.
		var tries = 0;
		var timer = window.setInterval( function () {
			tries += 1;
			if ( patchAll() || tries > 40 ) {
				window.clearInterval( timer );
			}
		}, 25 );
	}
})();
