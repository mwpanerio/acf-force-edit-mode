/**
 * Restore ACF block "edit" mode after WordPress drops the editor iframe.
 *
 * WP 7.x may iframe an empty/all-v3 canvas. ACF then forces mode=preview and
 * hides the toggle. Once an apiVersion < 3 ACF block is present, the iframe
 * goes away -- this script flips eligible blocks back to edit.
 */
(function () {
	'use strict';

	if ( ! window.wp || ! wp.data || ! wp.domReady ) {
		return;
	}

	var SKIP_BLOCKS = {
		'acf/homepage-block': true,
	};

	function isEditorIframed() {
		return document.querySelectorAll( 'iframe[name="editor-canvas"]' ).length > 0;
	}

	function shouldForceEdit( block ) {
		if ( ! block || ! block.name || block.name.indexOf( 'acf/' ) !== 0 ) {
			return false;
		}

		if ( SKIP_BLOCKS[ block.name ] ) {
			return false;
		}

		if ( block.attributes && block.attributes.mode === 'edit' ) {
			return false;
		}

		var type = wp.blocks.getBlockType( block.name );
		if ( type && type.supports && type.supports.jsx ) {
			return false;
		}

		return true;
	}

	function forceEligibleBlocksToEdit() {
		if ( isEditorIframed() ) {
			return;
		}

		var select = wp.data.select( 'core/block-editor' );
		var dispatch = wp.data.dispatch( 'core/block-editor' );
		var clientIds = select.getClientIdsWithDescendants();

		clientIds.forEach( function ( clientId ) {
			var block = select.getBlock( clientId );
			if ( ! shouldForceEdit( block ) ) {
				return;
			}
			dispatch.updateBlockAttributes( clientId, { mode: 'edit' } );
		} );
	}

	wp.domReady( function () {
		var wasIframed = isEditorIframed();
		var knownIds = wp.data.select( 'core/block-editor' ).getClientIdsWithDescendants().slice();
		var scheduled = false;

		function run() {
			var iframed = isEditorIframed();
			var clientIds = wp.data.select( 'core/block-editor' ).getClientIdsWithDescendants();
			var added = clientIds.filter( function ( id ) {
				return knownIds.indexOf( id ) === -1;
			} );

			// Iframe just dropped (e.g. first ACF v2 block inserted into empty canvas).
			if ( wasIframed && ! iframed ) {
				forceEligibleBlocksToEdit();
			} else if ( ! iframed && added.length ) {
				added.forEach( function ( clientId ) {
					var block = wp.data.select( 'core/block-editor' ).getBlock( clientId );
					if ( shouldForceEdit( block ) ) {
						wp.data.dispatch( 'core/block-editor' ).updateBlockAttributes( clientId, {
							mode: 'edit',
						} );
					}
				} );
			}

			wasIframed = iframed;
			knownIds = clientIds.slice();
		}

		wp.data.subscribe( function () {
			if ( scheduled ) {
				return;
			}
			scheduled = true;
			window.requestAnimationFrame( function () {
				scheduled = false;
				run();
			} );
		} );

		// Editor boot can still be settling after domReady.
		window.setTimeout( forceEligibleBlocksToEdit, 400 );
		window.setTimeout( forceEligibleBlocksToEdit, 1200 );
	} );
})();
