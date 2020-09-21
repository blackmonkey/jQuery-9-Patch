# jQuery 9 Patch

Contributors: [Chris London](https://github.com/chrislondon/), [Ryan Pendleton](https://github.com/rpendleton), [Ronald Coarite](https://stackoverflow.com/users/2154661/ronald-coarite), [Tom Swifty](https://stackoverflow.com/users/2773060/tom-swifty), [Oscar Cai](https://github.com/blackmonkey)  
Tags: 9patch, 9-patch, nine-patch

A single javascript file to render 9 Patch images on the webpages.

## Description

This project allows you to render `.9.png` or `.9.gif` files on webpages. These
files allow for rapid development of webpages with complex styles without having
to use complex CSS3.

## What Are 9 Patch Images

9 Patch images are stretchable, repeatable images reduced to their smallest
size. The simplest example would be if you were to take a rounded div and slice
it up into 9 squares like you would a tic-tac-toe board. The four corners
wouldn't change sizes at all but would be static while the other 5 pieces would
be stretched or repeated to all the whole image to scale appropriately.

With that explanation and the advent of CSS3 you might think that there is no
reason to use 9 patch images but the name '9 patch' is a misnomer. The images
can be sliced up into even smaller pieces.

The wiki page has images that will help understand better. It also contains more
details.

9 Patch images contain an index of which piece is what by adding a 1px border to
the image. The colors in the border determine if a piece is static (doesn't
scale), it stretches, or it repeats.

For more details see the wiki page: [What Are 9 Patch Images][what-are]

## How to Create 9 Patch Images

To create a 9 patch image you need to start with a `.png` or a `.gif` file.
JPEG's don't make good 9 patch images because they blur colors.

* Create the image that you would like to scale.
* Reduce it to the smallest pieces possible.
* Increase the canvas size to add a 1px border around the entire image
* Mark the different pieces with the appropriate colors in the border.
* Save the image as `[image-name].9.png` or `[image-name].9.gif`

For more details see the wiki page: [How to Create 9 Patch Images][create]

## Installation

Fork project on GitHub:

1. Go to the GitHub repository for [9-Patch-Image-for-Websites][repo]
2. Fork the repository ([how-to guide][fork])

For more details see the wiki page: [Installation][installation]

## Usage

* Install the `.js` file
* Include `.js` file in your HTML
	* All `<div>`'s with a background image `.9.(png|gif)` will automatically be
	  converted.

For more details see the wiki page: [Usage][usage]

## Known Issues

* Unfortunately Canvas isn't supported on <IE9 browsers. We have two branches to
  explore using canvas emulators but neither seem to be successful.

[what-are]: https://github.com/blackmonkey/jQuery-9-Patch/wiki/What-Are-9-Patch-Images
[create]: https://github.com/blackmonkey/jQuery-9-Patch/wiki/How-to-Create-9-Patch-Images
[repo]: https://github.com/blackmonkey/jQuery-9-Patch
[fork]: https://help.github.com/articles/fork-a-repo/
[installation]: https://github.com/blackmonkey/jQuery-9-Patch/wiki/Installation
[usage]: https://github.com/blackmonkey/jQuery-9-Patch/wiki/Usage
