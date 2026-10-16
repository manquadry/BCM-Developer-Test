<?php
/**
 * Q1 – Corrected template (PHP 8, WordPress theme).
 *
 * Assumptions about ad placeholders:
 *  - The marker is the literal text "[ad]" (no attributes, case-sensitive).
 *  - Each marker becomes <div class="ad ad-N"></div>, where N is a 1-based
 *    position counter across the page, so the JS ad handler can target slots.
 *  - Ads are inserted after the_content filters run, so wpautop cannot wrap
 *    the div in a <p>.
 */

$page   = isset( $_GET['page'] ) ? max( 1, absint( $_GET['page'] ) ) : 1;
$search = isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : '';

$q = new WP_Query( [
	'post_type'      => 'post',
	'post_status'    => 'publish',
	'posts_per_page' => 10,
	'paged'          => $page,
	's'              => $search,
] );

$pages = max( 1, (int) $q->max_num_pages );
?>
<h1>
	Page <?= esc_html( $page ) ?> of <?= esc_html( $pages ) ?>
	<?php if ( $search !== '' ) : ?>
		: Search for “<?= esc_html( $search ) ?>”
	<?php endif; ?>
</h1>

<?php if ( $q->have_posts() ) : ?>
	<?php
	$ad_index = 0;
	while ( $q->have_posts() ) :
		$q->the_post();

		$content = apply_filters( 'the_content', get_the_content() );

		// Leave the div for the JavaScript handler to replace with a live ad.
		$content = preg_replace_callback(
			'#\[ad\]#',
			function ( array $m ) use ( &$ad_index ): string {
				$ad_index++;
				return '<div class="ad ad-' . $ad_index . '"></div>';
			},
			$content
		);
		?>
		<article>
			<h2><?= esc_html( get_the_title() ) ?></h2>
			<div class="entry-content"><?= $content // Already filtered by the_content. ?></div>
		</article>
	<?php endwhile; ?>
<?php else : ?>
	<p>No posts found<?= $search !== '' ? ' for “' . esc_html( $search ) . '”' : '' ?>.</p>
<?php endif; ?>

<?php wp_reset_postdata(); ?>
