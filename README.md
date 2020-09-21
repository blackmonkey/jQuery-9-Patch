# jQuery 9 Patch

Contributors: [Chris London](https://github.com/chrislondon/), [Ryan Pendleton](https://github.com/rpendleton), [Ronald Coarite](https://stackoverflow.com/users/2154661/ronald-coarite), [Tom Swifty](https://stackoverflow.com/users/2773060/tom-swifty), [Oscar Cai](https://github.com/blackmonkey)  
Tags: 9patch, 9-patch, nine-patch

A single javascript file to render 9 Patch images on the webpages.

## Description

This project allows you to render `.9.png` or `.9.gif` files on webpages. These
files allow for rapid development of webpages with complex styles without having
to use complex CSS3.

## What are 9 patch images

9 patch images are is the exactly same concept as [NinePatch drawables](https://developer.android.com/guide/topics/graphics/drawables#nine-patch) in Android development. 

## How to create 9 patch images

To create a 9 patch image, you can use [Android Studio](https://developer.android.com/studio/write/draw9patch) or online tools [Android Asset Studio - Simple nine-patch generator](https://romannurik.github.io/AndroidAssetStudio/nine-patches.html#&sourceDensity=320&name=example).

## Installation

Fork project on GitHub:

1. Go to the GitHub repository for [9-Patch-Image-for-Websites][repo]
2. Fork the repository ([how-to guide][fork])

For more details see the wiki page: [Installation][installation]

## Usage

To test the script, or help me improve it, you can check out the repository to your local environment. Then go to folder `public_html` and start a HTTP server there. If you installed Python 3, you can start the simple HTTP server by the following command:

```batch
python -m http.server 12345
```

Then open `http://localhost:12345` in your favorite web browser, like Chrome. Then you can play with the script.

To use the script in your webpage, you can check out this repository, or directly download the script [9patch.js](https://raw.githubusercontent.com/blackmonkey/jQuery-9-Patch/master/public_html/js/9patch.js) or [9patch.min.js](https://raw.githubusercontent.com/blackmonkey/jQuery-9-Patch/master/public_html/js/9patch.min.js)

Then include jQuery and `9patch.min.js` in your webpage:
```html
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
<script type="text/javascript" src="9patch.min.js"></script>
```

Then all `<div>`s with a background image whose name ends with `.9.png` or `.9.gif` will automatically be rendered.

## Known Issues

* Unfortunately Canvas isn't supported on <IE9 browsers. We have two branches to explore using canvas emulators but neither seem to be successful.
