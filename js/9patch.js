/**
 * Convert RGBA components into a color integer.
 *
 * @param r {BigInt} the 8 bits integer value of red component.
 * @param g {BigInt} the 8 bits integer value of green component.
 * @param b {BigInt} the 8 bits integer value of blue component.
 * @param a {BigInt} the 8 bits integer value of alpha component.
 * @return {BigInt} the 32 bits composed Color.
 */
function rgba2Color(r, g, b, a) {
	return r << 24 | g << 16 | b << 8 | a;
}

/**
 * 9patch constructor. Sets up cached data and runs initial draw.
 *
 * @constructor
 * @param div {Object} The DOM Element where the 9-path image is painted
 * @param bgImgUrl {string} The URL of background image.
 * @returns {NinePatch} A nine path object
 */
function NinePatch(div, bgImgUrl) {
	this.div = div;
	this.padding = {top: 0, left: 0, right: 0, bottom: 0};

	// Load 9patch from background-image
	const _this = this;
	this.bgImage = new Image();
	this.bgImage.onload = function() {
		_this.originalBgColor = _this.div.css('background-color');
		if (_this.originalBgColor === 'none') {
			_this.originalBgColor = '';
		}
		_this.div.css('background', 'none');

		// Create a temporary canvas to get the 9Patch index data.
		let tempCanvas = document.createElement('canvas');
		tempCanvas.width = _this.bgImage.width;
		tempCanvas.height = _this.bgImage.height;

		let tempCtx = tempCanvas.getContext('2d');
		tempCtx.drawImage(_this.bgImage, 0, 0);

		// Loop over top pixels to get horizontal pieces
		let data = tempCtx.getImageData(0, 0, _this.bgImage.width, 1).data;
		// Use the upper-left corner to get staticColor, use the upper-right corner to get the repeatColor.
		const staticColor = rgba2Color(data[0], data[1], data[2], data[3]);
		const repeatColor = rgba2Color(data[data.length - 4], data[data.length - 3], data[data.length - 2], data[data.length - 1]);
		_this.horizontalPieces = _this.getPieces(data.slice(4, data.length - 4), staticColor, repeatColor);

		// Loop over left pixels to get vertical pieces
		data = tempCtx.getImageData(0, 1, 1, _this.bgImage.height - 2).data;
		_this.verticalPieces = _this.getPieces(data, staticColor, repeatColor);

		// Obtaining the padding on right border
		data = tempCtx.getImageData(_this.bgImage.width - 1, 0, 1, _this.bgImage.height).data;
		const rightPadding = _this.getBorderPadding(data, _this.verticalPieces);
		_this.padding.top = rightPadding.begin;
		_this.padding.bottom = rightPadding.end;

		// Obtaining the padding on bottom border
		data = tempCtx.getImageData(0, _this.bgImage.height - 1, _this.bgImage.width, 1).data;
		const bottomPadding = _this.getBorderPadding(data, _this.horizontalPieces);
		_this.padding.left = bottomPadding.begin;
		_this.padding.right = bottomPadding.end;

		// determine if we could use border image (only available on single stretch area images
		if (_this.horizontalPieces.length === 3 && _this.verticalPieces.length === 3
				&& _this.horizontalPieces[0][0] === 's' && _this.horizontalPieces[1][0] !== 's'
				&& _this.horizontalPieces[2][0] === 's' && _this.verticalPieces[0][0] === 's'
				&& _this.verticalPieces[1][0] !== 's' && _this.verticalPieces[2][0] === 's') {
			// This is a simple 9 patch so use CSS3
			_this.drawCSS3();
		} else {
			// use this.horizontalPieces and this.verticalPieces to generate image
			_this.draw();
			_this.div.on('resize', _this.draw);
		}
	};
	this.bgImage.src = bgImgUrl;
}

// Stores the HTMLDivElement that's using the 9patch image
NinePatch.prototype.div = null;
// Padding
NinePatch.prototype.padding = null;
// Stores the original background css color to use later
NinePatch.prototype.originalBgColor = null;
// Stores the pieces used to generate the horizontal layout
NinePatch.prototype.horizontalPieces = null;
// Stores the pieces used to generate the vertical layout
NinePatch.prototype.verticalPieces = null;
// Stores the 9patch image
NinePatch.prototype.bgImage = null;

/**
 * Gets the horizontal|vertical pieces based on image data
 *
 * @param data {Uint8Array} the image data.
 * @param staticColor {BigInt} the color to indicate static pixels .
 * @param repeatColor {BigInt} the color to indicate repeat pixels.
 * @return {Array} The pieces information.
 */
NinePatch.prototype.getPieces = function(data, staticColor, repeatColor) {
	const pieces = [];
	let curColor = rgba2Color(data[0], data[1], data[2], data[3]);
	let preType = (curColor === staticColor ? 's' : (curColor === repeatColor ? 'r' : 'd'));
	let start = 1;

	let curType, width, i, curPos;
	for (i = 4; i < data.length; i += 4) {
		curPos = i / 4 + 1;
		curColor = rgba2Color(data[i], data[i + 1], data[i + 2], data[i + 3]);
		curType = (curColor === staticColor ? 's' : (curColor === repeatColor ? 'r' : 'd'));
		if (preType !== curType) {
			// box changed colors
			width = curPos - start;
			pieces.push([preType, start, width]);

			preType = curType;
			start = curPos;
		}
	}

	// push end
	width = curPos - start + 1; // the last pixel should be counted.
	pieces.push([preType, start, width]);
	return pieces;
};

/**
 * Get padding on border.
 *
 * @param dataPad {Uint8Array} the padding border image data.
 * @param pieces {Array} the related pieces information.
 * @return {{end: number, begin: number}}
 */
NinePatch.prototype.getBorderPadding = function(dataPad, pieces) {
	const staticColor = rgba2Color(dataPad[0], dataPad[1], dataPad[2], dataPad[3]);
	const padding = {begin: 0, end: 0};
	const minValidPixelIndex = 4;
	const maxValidPixelIndex = dataPad.length - 8;
	let i, curColor;

	// padding at beginning but skip the first pixel which is on the padding border.
	let foundPadIndex = false;
	for (i = minValidPixelIndex; i <= maxValidPixelIndex; i += 4) {
		curColor = rgba2Color(dataPad[i], dataPad[i + 1], dataPad[i + 2], dataPad[i + 3]);
		if (curColor !== staticColor) {
			foundPadIndex = true;
			break;
		}
	}
	if (foundPadIndex) {
		padding.begin = i / 4 - 1; // filter out the pixel on the padding border.
	} else {
		// There is no padding index on the border, the begin padding should equal to the first piece size,
		// while the end padding should equal to the last piece size.
		padding.begin = pieces[0][2];
		padding.end = pieces[pieces.length - 1][2];
		return padding;
	}

	// to here, there must be padding index on the border.
	// padding at end but skip the last pixel which is on the padding border.
	for (i = maxValidPixelIndex; i >= minValidPixelIndex; i -= 4) {
		curColor = rgba2Color(dataPad[i], dataPad[i + 1], dataPad[i + 2], dataPad[i + 3]);
		if (curColor !== staticColor) {
			break;
		}
	}
	padding.end = (maxValidPixelIndex - i) / 4;
	return padding;
};

/**
 * Draw the background for the given element size.
 */
NinePatch.prototype.draw = function() {
	if (this.horizontalPieces === null || this.verticalPieces === null) {
		return;
	}

	const canvas = document.createElement('canvas');
	canvas.width = this.div.width() + this.padding.left + this.padding.right;
	canvas.height = this.div.height() + this.padding.top + this.padding.bottom;

	const ctx = canvas.getContext('2d');

	// Determine the width for the static and dynamic pieces
	let staticWidth = 0;
	let stretchCount = 0;
	let i;
	for (i = 0; i < this.horizontalPieces.length; i++) {
		if (this.horizontalPieces[i][0] === 's') {
			staticWidth += this.horizontalPieces[i][2];
		} else {
			stretchCount++;
		}
	}
	const evenFillWidth = stretchCount > 0 ? (canvas.width - staticWidth) / stretchCount : 0;

	// Determine the height for the static and dynamic pieces
	let staticHeight = 0;
	stretchCount = 0;
	for (i = 0; i < this.verticalPieces.length; i++) {
		if (this.verticalPieces[i][0] === 's') {
			staticHeight += this.verticalPieces[i][2];
		} else {
			stretchCount++;
		}
	}
	const evenFillHeight = stretchCount > 0 ? (canvas.height - staticHeight) / stretchCount : 0;

	// Loop through each of the vertical/horizontal pieces and draw on the canvas
	let fillWidth, fillHeight, tempCanvas, tempCtx;
	for (i = 0; i < this.verticalPieces.length; i++) {
		for (let j = 0; j < this.horizontalPieces.length; j++) {
			fillWidth = (this.horizontalPieces[j][0] === 'd') ? evenFillWidth : this.horizontalPieces[j][2];
			fillHeight = (this.verticalPieces[i][0] === 'd') ? evenFillHeight : this.verticalPieces[i][2];

			// Stretching :
			if (this.verticalPieces[i][0] !== 'r') {
				// Stretching is the same function for the static squares
				// the only difference is the widths/heights are the same.
				ctx.drawImage(
					this.bgImage,
					this.horizontalPieces[j][1], this.verticalPieces[i][1],
					this.horizontalPieces[j][2], this.verticalPieces[i][2],
					0, 0,
					fillWidth, fillHeight);
			} else {
				tempCanvas = document.createElement('canvas');
				tempCanvas.width = this.horizontalPieces[j][2];
				tempCanvas.height = this.verticalPieces[i][2];

				tempCtx = tempCanvas.getContext('2d');
				tempCtx.drawImage(this.bgImage,
					this.horizontalPieces[j][1], this.verticalPieces[i][1],
					this.horizontalPieces[j][2], this.verticalPieces[i][2],
					0, 0,
					this.horizontalPieces[j][2], this.verticalPieces[i][2]);

				ctx.fillStyle = ctx.createPattern(tempCanvas, 'repeat');
				ctx.fillRect(0, 0, fillWidth, fillHeight);
			}

			// Shift to next x position
			ctx.translate(fillWidth, 0);
		}

		// shift back to 0 x and down to the next line
		ctx.translate(-canvas.width, (this.verticalPieces[i][0] === 's' ? this.verticalPieces[i][2] : evenFillHeight));
	}

	// store the canvas as the div's background
	const encodedData = canvas.toDataURL('image/png');
	this.div.css('background', this.originalBgColor + ' url(' + encodedData + ') no-repeat');
	this.div.css('padding-left', this.padding.left);
	this.div.css('padding-right', this.padding.right);
	this.div.css('padding-top', this.padding.top);
	this.div.css('padding-bottom', this.padding.bottom);
};

/**
 * Extract simple 9-patch images and setup CSS3 styles for it.
 */
NinePatch.prototype.drawCSS3 = function() {
	const canvas = document.createElement('canvas');
	canvas.width = this.bgImage.width - 2;
	canvas.height = this.bgImage.height - 2;

	const ctx = canvas.getContext('2d');
	ctx.drawImage(this.bgImage, -1, -1);

	const encodedData = canvas.toDataURL('image/png');
	const pixPX = this.padding.top + 'px ' + this.padding.right + 'px ' + this.padding.bottom + 'px ' + this.padding.left + 'px';
	const pix = pixPX.replaceAll('px', '');
	this.div.css('border-width', pixPX);
	this.div.css('border-style', 'solid');
	this.div.css('padding', '0');
	this.div.css('border-image', 'url(' + encodedData + ') ' + pix + ' fill '
		+ (this.horizontalPieces[1][1] === 'r' ? 'repeat' : 'stretch') + ' '
		+ (this.verticalPieces[1][1] === 'r' ? 'repeat' : 'stretch'));
	// Take image and slice out border
}

window['NinePatch'] = NinePatch;

// Run through all divs onload and initiate NinePatch objects
$(function() {
	$('*').each(function(){
		const _this = $(this);
		const bgImageMatch = _this.css('background-image').match(/\(\s*['"](.*?\.9\.(?:png|gif))['"]\s*\)/i);
		if (bgImageMatch) {
			new NinePatch(_this, bgImageMatch[1]);
		}
	});
});
