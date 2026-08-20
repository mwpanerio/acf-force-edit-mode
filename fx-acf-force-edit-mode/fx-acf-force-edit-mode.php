<?php

/**
 * FX ACF Force Edit Mode -- plugin bootstrap.
 *
 * Newer WordPress releases always iframe the post editor. ACF V2 edit-mode
 * fields (TinyMCE/jQuery) cannot run inside that iframe, so ACF forces preview.
 * This MU plugin:
 * 1. Prefers ACF block version 2 + mode=edit (FX BAM / ACF registration).
 * 2. Forces a non-iframe editor canvas (JS patch).
 * 3. Restores mode=edit on ACF blocks if ACF still flips them to preview.
 *
 * @see https://make.wordpress.org/core/2026/08/03/iframed-editor-changes-in-wordpress-7-1/
 * @see https://www.advancedcustomfields.com/resources/acf-blocks-v3/
 */

defined( 'ABSPATH' ) || exit;

if ( defined( 'FX_ACF_FORCE_EDIT_MODE_LOADED' ) ) {
	return;
}

define( 'FX_ACF_FORCE_EDIT_MODE_LOADED', true );
define( 'FX_ACF_FORCE_EDIT_MODE_VERSION', '1.0.0' );
define( 'FX_ACF_FORCE_EDIT_MODE_DIR', __DIR__ );
define( 'FX_ACF_FORCE_EDIT_MODE_URL', plugin_dir_url( __FILE__ ) );

/**
 * Prefer ACF Blocks V2 globally when no explicit version is set.
 *
 * @param int|string $version Default ACF block version.
 * @param array      $block   Block settings.
 * @return int
 */
add_filter( 'acf/blocks/default_block_version', 'fx_acf_force_edit_mode_default_block_version', 10, 2 );
function fx_acf_force_edit_mode_default_block_version( $version, $block ): int {
	return 2;
}

/**
 * Force FX BAM-registered blocks onto V2 edit mode (fields in the canvas).
 *
 * JSX / InnerBlocks parents must stay in preview.
 *
 * @param array $args     Parsed block registration args.
 * @param array $settings Original fx_register_block() settings.
 * @return array
 */
add_filter( 'fx_bam_before_register_block', 'fx_acf_force_edit_mode_bam_v2_edit_mode', 10, 2 );
function fx_acf_force_edit_mode_bam_v2_edit_mode( array $args, array $settings ): array {
	if ( ! empty( $args['supports']['jsx'] ) ) {
		$args['mode'] = 'preview';
		return $args;
	}

	$args['acf_block_version']  = 2;
	$args['api_version']        = 2;
	$args['mode']               = 'edit';
	$args['attributes']['mode'] = [
		'type'    => 'string',
		'default' => 'edit',
	];

	unset( $args['auto_inline_editing'], $args['hide_fields_in_sidebar'] );

	return $args;
}

/**
 * Force non-iframe canvas early (before VisualEditor mounts).
 */
add_action( 'enqueue_block_editor_assets', 'fx_acf_force_edit_mode_enqueue_non_iframe_canvas', 1 );
function fx_acf_force_edit_mode_enqueue_non_iframe_canvas(): void {
	$path = FX_ACF_FORCE_EDIT_MODE_DIR . '/assets/js/acf-force-non-iframe-canvas.js';

	if ( ! is_file( $path ) ) {
		return;
	}

	$js = (string) file_get_contents( $path );

	if ( wp_script_is( 'react-jsx-runtime', 'registered' ) ) {
		wp_add_inline_script( 'react-jsx-runtime', $js, 'after' );
		return;
	}

	if ( wp_script_is( 'wp-element', 'registered' ) ) {
		wp_add_inline_script( 'wp-element', $js, 'after' );
	}
}

/**
 * Restore ACF edit mode after the canvas is non-iframed.
 */
add_action( 'enqueue_block_editor_assets', 'fx_acf_force_edit_mode_enqueue_edit_mode_script' );
function fx_acf_force_edit_mode_enqueue_edit_mode_script(): void {
	$relative = 'assets/js/acf-block-edit-mode.js';
	$path     = FX_ACF_FORCE_EDIT_MODE_DIR . '/' . $relative;

	if ( ! is_file( $path ) ) {
		return;
	}

	wp_enqueue_script(
		'fx-acf-force-edit-mode-script',
		FX_ACF_FORCE_EDIT_MODE_URL . $relative,
		[ 'wp-data', 'wp-blocks', 'wp-dom-ready', 'wp-block-editor' ],
		(string) filemtime( $path ),
		true
	);
}
