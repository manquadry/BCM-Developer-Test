<?php
/**
 * Plugin Name: Q1 Test Harness
 * Description: Serves the Q1 search/pagination template at /?q1_test=1 and creates sample posts on activation. For local testing only.
 * Version:     1.0
 */

// Create 25 plain posts plus one post containing several [ad] markers (runs once).
register_activation_hook( __FILE__, function () {
	if ( get_option( 'q1_test_seeded' ) ) {
		return;
	}
	for ( $i = 1; $i <= 25; $i++ ) {
		wp_insert_post( [
			'post_title'   => "Q1 sample post $i",
			'post_content' => "Body of sample post $i.",
			'post_status'  => 'publish',
		] );
	}
	wp_insert_post( [
		'post_title'   => 'Q1 ad marker post',
		'post_content' => "First paragraph [ad] second paragraph [ad] third paragraph [ad] end. The letters a and d elsewhere must stay untouched.",
		'post_status'  => 'publish',
	] );
	update_option( 'q1_test_seeded', 1 );
} );

// Render the template at /?q1_test=1 (add &page=2, &s=term and so on).
add_action( 'template_redirect', function () {
	if ( isset( $_GET['q1_test'] ) ) {
		include __DIR__ . '/search-template.php';
		exit;
	}
} );
