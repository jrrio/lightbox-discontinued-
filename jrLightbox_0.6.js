/**
 * This code creates some layers (overlay, lightbox, etc.) to display
 * an image while fading the document viewport.
 * @author Joao Rodrigues (JR) - Jan/2009
 * @see http://www.jrfaq.com.br/lightbox.htm
 * @version 0.5a - 2009-04-25
 * @version 0.5b - 2011-03-14 - removed the java-like approach.
 * @version 0.6  - 2011-04-27 - some code optimizations.
 *
 * Dependencies: lightbox.css; ajax_circle1.gif; and close_20x20.gif
 *
 * Concepts / code adapted from:
 * Lokesh Dhakar's Lightbox JS <http://huddletogether.com/projects/lightbox>
 * Peter-Paul Koch <http://www.quirksmode.org/mobile/viewports.html>
 * David Mark <http://www.cinsoft.net/viewport.asp>
 */
(function (global) {

  global.jrLightBox = {

    /* Adjust config values according to your lightbox.css file and
     * your images paths.
     * 'preloadImages' may be changed to false if there are many images
     * in the page or they are big sized -> false speeds up user experience
     * while loading the page.
     * lightboxVerticalPad == div#lightbox padding-top/bottom (25) +
     *      border-top/bottom (2) + #lightboxDetails padding-top (10) +
     *      lightboxDetails height (17)
     *
     * lightboxHorizontalPad == div#lightbox border-left/right (2) +
     *      padding-left/right (20)
     */
    config: {
      preloadImages: true,
      lightboxVerticalPad: 54,
      lightboxHorizontalPad: 22,
      lightboxCloseMsg: "Close",
      loadingGIF: ["images/lightbox/ajax_circle1.gif",
                   "Click here to cancel"],
      closeGIF: ["images/lightbox/close_20x20.gif",
                 "Click on the image ou press X to close"]
    },

    /* 'elements' object stores the following elements for later use:
       divOverLay, divLightBox, divLightBoxDetails, divLightBoxCaption,
       imgloadingGIF, imgLightBoxImage
    */
    elements: {},

    getPageHeight: function () {
      /** scrollWidth/Height return the width and height of the total content
       *  area of the browser window, including any parts that are currently
       *  hidden. If there's no hidden content then they should be equal to
       *  clientWidth/Height.
       *  @return (Number) pageHeight
       *
       *  Circumvent some bugs:
       *  - Don't use yScroll = window.innerHeight + window.scrollMaxY, use
       *    document.body.scrollHeight instead (FF 3+)
       *    @see https://developer.mozilla.org/en/DOM/window.scrollMaxY
       *
       *  - scrollWidth/Height are buggy in IE6-8 and Opera 10. So, we'll
       *     compare (scrollTop + clientHeight) to scrollHeight.
       *    @see http://www.quirksmode.org/dom/w3c_cssom.html
       */
      var root = this.root, doc = document.body, pageHeight;

      pageHeight = root.scrollTop + root.clientHeight;
      if (pageHeight < root.scrollHeight) { pageHeight = root.scrollHeight; }

      /* We might encounter a weird scenario in WebKits (Chrome 10, Safari 4),
       * when the browser window size becomes smaller than some of the images
       * shown in lightbox, thus making document.body.scrollHeight > pageHeight.
       */
      if (pageHeight < doc.scrollHeight) { pageHeight = doc.scrollHeight; }

      return pageHeight;
    },

    getVerticalScroll: function () {
      /** Get the scrolling offset of the viewport.
       *  The return value may differ every time this function is called,
       *  depending on the vertical scrollbar.
       *  It may seem odd at first sight, but depending on the size of the
       *  browser window and mode (strict or quirks), we can have values for
       *  some properties and not for others. That's why this code keeps
       *  testing for every possibility.
       *  @see http://www.quirksmode.org/dom/w3c_cssom.html
       */
      var yScroll, doc = document;
      if (window.pageYOffset) {
        // IE9, FF3+, Safari 4+, Chrome 4+, Opera 10+
        yScroll = window.pageYOffset;
      } else if (doc.documentElement && doc.documentElement.scrollTop) {
        // IE and others in standards-compliant mode (strict mode).
        yScroll = doc.documentElement.scrollTop;
      } else if (doc.body) {
        // IE in quirks mode and last resort for the other browsers.
        yScroll = doc.body.scrollTop;
      }
      return yScroll;
    },

    hideLightBox: function () {
      var elems = this.elements;
      // Hide all divs created by code.
      elems.divOverLay.style.display = 'none';
      elems.divLightBox.style.display = 'none';
      elems.imgLightBoxImage.style.display = 'none'; // avoid flickering.
      elems.divLightBoxCaption.innerHTML = '';
      elems.divLightBoxCaption.style.display = 'none';
      // Make select tags visible again; showLightBox() make them hidden.
      this.setSelectVisibility("visible");
      // disable keypress listener
      document.onkeypress = '';
    },

    init: function () {
      /* Loop over link tags containing a rel="lightbox" attribute.
       * These links receive onclick events that will show the lightbox.
       */
      var len, $link, $links = document.links, $linksHRef = [];
      len = $links.length;
      while (len--) {
        $link = $links[len];
        if ($link.href && $link.rel === "lightbox") {
          $linksHRef.push($link.href);
          $link.onclick = function () {
            jrLightBox.showLightBox(this); return false; // this = $link.
          };
        }
      }
      if (this.config.preloadImages && document.images) {
        // Preload images which src attribute are stored in the array.
        var i, pics = [];
        i = $linksHRef.length;
        while (i--) {
          pics[i] = new Image();
          pics[i].src = $linksHRef[i];
        }
      }
    },

    showLightBox: function (varLink) {
      var elems = this.elements,
          imgloadingGIF = elems.imgloadingGIF,
          pageScroll = this.getVerticalScroll(),
          pageHeight = this.getPageHeight(),
          arrViewport = this.getViewportSize(),
          imgPreload = new Image(); // for varLink preloading.

      // Center loadingGIF, if it exists, on the viewport.
      if (imgloadingGIF) {
        imgloadingGIF.style.top = (pageScroll + ((arrViewport[1] -
                                   imgloadingGIF.height) / 2) + 'px');
        imgloadingGIF.style.left = (((arrViewport[0] -
                                      imgloadingGIF.width) / 2) + 'px');
        imgloadingGIF.style.display = 'block';
      }

      // Set divOverLay height to the current page height and show.
      elems.divOverLay.style.height = pageHeight + 'px';
      elems.divOverLay.style.display = 'block';

      imgPreload.onerror = jrLightBox.hideLightBox;

      imgPreload.onload = function () {
        /** This function is used in a Image() onload event handler, which
         *  fires as soon as Image.src is assigned a URL.
         */
        var that = jrLightBox, config = that.config, els = that.elements,
            lightboxTop, lightboxLeft;

        els.imgLightBoxImage.src = this.src; // this refers to the Image object.
        els.imgLightBoxImage.style.display = 'block';

        if (varLink.title) {
          els.divLightBoxCaption.innerHTML = varLink.title;
          els.divLightBoxCaption.style.display = 'block';
        }

        lightboxTop = pageScroll + ((arrViewport[1] -
                      config.lightboxVerticalPad - this.height) / 2);
        lightboxLeft = ((arrViewport[0] - config.lightboxHorizontalPad -
                         this.width) / 2);
        /* Center lightbox and make sure that the top and left values
         * are not negative and the image is not placed outside the viewport.
         */
        els.divLightBox.style.top = (lightboxTop < 0) ?
                                     "0px" : lightboxTop + "px";
        els.divLightBox.style.left = (lightboxLeft < 0) ?
                                      "0px" : lightboxLeft + "px";

        if (els.imgloadingGIF) {
          els.imgloadingGIF.style.display = 'none';
        }

        // Hide select boxes as they will 'peek' through the image in IE
        that.setSelectVisibility("hidden");

        els.divLightBox.style.display = 'block';

        // Check for 'x' keypress
        document.onkeypress = function (evt) {
          // Gets keycode. If the 'x' key is pressed then it hides the lightbox.
          var keynum, key;
          keynum = (window.event) ? window.event.keyCode : evt.which;
          key = String.fromCharCode(keynum).toLowerCase();
          if (key === 'x') { jrLightBox.hideLightBox(); }
        };

        /* After image is loaded, update the overlay height as the new image
         * might have increased the overall page height.
         * NOTE: Discard the pageHeight closure and force a setTimeout
         * of 100 ms, otherwise FF4 will get the last cached value instead
         * of the actual one. It's weird, but in FF4 imgPreload.onload
         * finishes its job a few ms before getPageHeight() is done.
         */
        window.setTimeout(function () {
          jrLightBox.elements.divOverLay.style.height = jrLightBox.
            getPageHeight() + 'px'; }, 100);
      };

      // Next line will fire imgPreload.onload.
      imgPreload.src = varLink.href;
    },

    setSelectVisibility: function (visStyle) {
      var i, selects = document.getElementsByTagName("select");
      for (i = 0; i !== selects.length; i++) {
        selects[i].style.visibility = visStyle;
      }
    }
  };

  /**@see http://www.cinsoft.net/viewport.asp
   * @see http://msdn.microsoft.com/en-us/library/ms533687(v=VS.85).aspx
   * In IE, the HTML element (document.documentElement) is used for the
   * viewport in standards mode (also known as "strict mode") and the body
   * (document.body) is used in "quirks mode" (HTML is not rendered -
   * document is displayed as it was displayed in previous versions of IE).
   *
   * document.documentElement.clientHeight (in strict mode) may
   * output a slightly different value from document.body.clientHeight (in
   * quirks mode).
   *
   * In IE6-8, the document.compatMode property indicates the rendering mode:
   * - CSS1Compat --> standards-compliant mode ("strict mode");
   * - BackCompat --> "quirks mode".
   * Just for the record: in IE 8, the compatMode property is deprecated in
   *   favor of the documentMode property.
   */
  var doc = global.document, compatMode = doc.compatMode,
      html = doc.documentElement;

  if (typeof compatMode === 'string') {
    jrLightBox.root = (html && compatMode.toLowerCase().
      indexOf('css') !== -1 && html.clientWidth) ? html : doc.body;
  } else {
    jrLightBox.root = (!html || html.clientWidth === 0) ? doc.body : html;
  }

  if (typeof doc.clientWidth !== 'undefined') {
    /** Some older KHTML-based browsers (e.g. Safari 2) feature
     * document.clientHeight/Width properties, but have trouble with
     * clientHeight/Width as well as innerHeight/Width.
     */
    jrLightBox.getViewportSize = function () {
      return [document.clientWidth, document.clientHeight];
    };

  } else if (html && typeof html.clientWidth === 'number') {
    /** document.documentElement.clientHeight - IE in "strict mode", FF, etc. -
     *  retrieves the height of the viewport including padding, but not
     *  including margin, border, or scroll bar.
     */
    jrLightBox.getViewportSize = function () {
      var root = this.root;
      return [root.clientWidth, root.clientHeight];
    };

  } else if (typeof window.innerWidth === 'number') {
    /** As a last resort, return window.innerWidth/Height.
     * window.innerWidth - FF / Chrome, etc. - Width (in pixels) of the
     *   browser window viewport including, if rendered, the vertical scrollbar.
     * window.innerHeight - Height (in pixels) of the browser window viewport
     *   including, if rendered, the horizontal scrollbar.
     */
    jrLightBox.getViewportSize = function () {
      return [window.innerWidth, window.innerHeight];
    };
  }

  /* Finally, let's create the following html code at the bottom of the page:

    <div id="overlay">
      <a href="#">
        <img id="loadingGIF" src="images/ajax_circle1.gif" />
      </a>
    </div>
    <div id="lightbox">
      <a href="#" title="Click on the image ou press X to close">
        <img id="lightboxImage" src="images/someImage.jpg"/>
        <div id="lightboxCloseMsg">Close</div>
        <img id="closeGIF" src="images/close_20x20.gif"/>
      </a>
      <div id="lightboxDetails">
        <div id="lightboxCaption">Here goes a description for the image</div>
      </div>
    </div>

  */
  var config = jrLightBox.config, els = jrLightBox.elements,
      fragment = doc.createDocumentFragment(),
      newDiv, linkTag, divLightBoxCloseMsg, imgCloseGIF;

  // Create div overlay and its children elements.
  (newDiv = doc.createElement("div")).id = 'overlay';
  (linkTag = doc.createElement("a")).href = '#';
  linkTag.title = config.loadingGIF[1];
  linkTag.onclick = function () { jrLightBox.hideLightBox();
                                   return false; };
  (els.imgloadingGIF = doc.createElement("img")).id = 'loadingGIF';
  els.imgloadingGIF.src = config.loadingGIF[0];
  // Append elements to the DOM fragment.
  linkTag.appendChild(els.imgloadingGIF);
  newDiv.appendChild(linkTag);
  // Store and append newDiv.
  fragment.appendChild(els.divOverLay = newDiv);

  // Create lightbox div and its children elements.
  (newDiv = doc.createElement("div")).id = 'lightbox';
  (linkTag = doc.createElement("a")).href = '#';
  linkTag.title = config.closeGIF[1];
  linkTag.onclick = function () { jrLightBox.hideLightBox();
                                   return false; };

  // Create and append children to linkTag - img src will be set later.
  (els.imgLightBoxImage = doc.createElement("img")).id = 'lightboxImage';
  (divLightBoxCloseMsg = doc.createElement("div")).id = 'lightboxCloseMsg';
  divLightBoxCloseMsg.appendChild(doc.createTextNode(config.lightboxCloseMsg));
  (imgCloseGIF = doc.createElement("img")).id = 'closeGIF';
  imgCloseGIF.src = config.closeGIF[0];

  linkTag.appendChild(els.imgLightBoxImage); //src will be caught later.
  linkTag.appendChild(divLightBoxCloseMsg);
  linkTag.appendChild(imgCloseGIF);

  newDiv.appendChild(linkTag);

  // Create lightboxDetails div and its child.
  (els.divLightBoxDetails = doc.createElement("div")).id = 'lightboxDetails';
  (els.divLightBoxCaption = doc.createElement("div")).id = 'lightboxCaption';

  // Append to DOM.
  els.divLightBoxDetails.appendChild(els.divLightBoxCaption);
  newDiv.appendChild(els.divLightBoxDetails);
  fragment.appendChild(els.divLightBox = newDiv);
  // Finally append the DOM fragment to the page body.
  doc.body.appendChild(fragment);

  // Discard unneeded host object / elements references
  doc = html = config = els = fragment = null;

}(this));

window.onload = function () {
  // Alternatively, you may place this line in the body's onload event handler attribute, e.g.
  // <body onload="jrLightBox.init()">
  jrLightBox.init();
};