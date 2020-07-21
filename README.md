# lightbox
An old Lightbox project made in 2011 with pure JavaScript and CSS

This example uses Javascript to create an overlay div and show an image inside another div called lightbox. Please follow the steps below:

1. Copy lightbox.css to your website;
2. Place ajax_circle1.gif and close_20x20.gif in the images directory of your website;
3. Refer to jrLightbox_0.6.js in the end of your page's body tag (take a look at the source of this example):
   <script type="text/javascript" src="includes/jrLightbox_0.6.js"></script>
4. A link (<a> tag) in the page will do the trick:
   <a href="FullSizedImage.jpg" rel="lightbox" title="Caption"><img src="Thumbnail.jpg" /></a>

It's very important to define the following attributes for each link as below:
- href - the image you want to display in the LightBox;
- title - the image's caption to be shown in the LightBox;
- rel - this must contain the word "lightbox".

Please follow the comments in the .js file to understand how the code works.
