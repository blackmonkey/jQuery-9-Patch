// Attach NinePatchWindowLoad to the window load
if (window.attachEvent) {
	window.attachEvent('onload', NinePatchWindowLoad);
} else if (window.addEventListener) {
	window.addEventListener('load', NinePatchWindowLoad, false);
} else {
	document.addEventListener('load', NinePatchWindowLoad, false);
}

// Run through all divs onload and initiate NinePatch objects
function NinePatchWindowLoad() {
	var elms = document.getElementsByTagName('div');
	for (var i = 0; i < elms.length; i++) {
		if (NinePatchGetStyle(elms[i], 'background-image').match(/\.9\.(png|gif)/i)) {
			new NinePatch(elms[i]);
		}
	}
}

// Cross browser function to get computed style.
function NinePatchGetStyle(element, styleKey) {
	var value = $(element).css(styleKey);
	return value != 'none' ? value : '';
}

function rgba2Color(r, g, b, a) {
	return r << 24 | g << 16 | b << 8 | a;
}

/**
 * 9patch constructer.  Sets up cached data and runs initial draw.
 *
 * @constructor
 * @param {Dom Element} div The DOM Element where the ninepath is painted
 * @returns {NinePatch} A nine path object
 */
function NinePatch(div) {
	this.div = $(div);
	this.padding = {top: 0, left: 0, right: 0, bottom: 0};
	// Load 9patch from background-image
	this.bgImage = new Image();
	this.bgImage.src = NinePatchGetStyle(this.div, 'background-image').replace(/"/g,"").replace(/url\(|\)$/ig, "");
	var _this = this;

	this.bgImage.onload = function() {
		_this.originalBgColor = NinePatchGetStyle(_this.div, 'background-color');
		_this.div.css('background', 'none');

		// Create a temporary canvas to get the 9Patch index data.
		var tempCtx, tempCanvas;
		tempCanvas = document.createElement('canvas');
		tempCanvas.width = _this.bgImage.width;
		tempCanvas.height = _this.bgImage.height;
		tempCtx = tempCanvas.getContext('2d');
		tempCtx.drawImage(_this.bgImage, 0, 0);

		// Loop over top pixels to get horizontal pieces
		var data = tempCtx.getImageData(0, 0, _this.bgImage.width, 1).data;
		// Use the upper-left corner to get staticColor, use the upper-right corner to get the repeatColor.
		var staticColor = rgba2Color(data[0], data[1], data[2], data[3]);
		var repeatColor = rgba2Color(data[data.length - 4], data[data.length - 3], data[data.length - 2], data[data.length - 1]);
		_this.horizontalPieces = _this.getPieces(data.slice(4, data.length - 4), staticColor, repeatColor);

		// Loop over left pixels to get vertical pieces
		data = tempCtx.getImageData(0, 1, 1, _this.bgImage.height - 2).data;
		_this.verticalPieces = _this.getPieces(data, staticColor, repeatColor);

		// Obtaining the padding on right border
		var dataPad = tempCtx.getImageData(_this.bgImage.width - 1, 0, 1, _this.bgImage.height).data;
		var rightPadding = _this.getBorderPadding(dataPad, _this.verticalPieces);
		_this.padding.top = rightPadding.begin;
		_this.padding.bottom = rightPadding.end;

		// Obtaining the padding on bottom border
		dataPad = tempCtx.getImageData(0, _this.bgImage.height - 1, _this.bgImage.width, 1).data;
		var bottomPadding = _this.getBorderPadding(dataPad, _this.horizontalPieces);
		_this.padding.left = bottomPadding.begin;
		_this.padding.right = bottomPadding.end;

		// determine if we could use border image (only available on single stretch area images
		if (_this.horizontalPieces.length == 3 && _this.verticalPieces.length == 3
				&& _this.horizontalPieces[0][0] == 's' && _this.horizontalPieces[1][0] != 's'
				&& _this.horizontalPieces[2][0] == 's' && _this.verticalPieces[0][0] == 's'
				&& _this.verticalPieces[1][0] != 's' && _this.verticalPieces[2][0] == 's') {
			// This is a simple 9 patch so use CSS3
			_this.drawCSS3();
		} else {
			// use this.horizontalPieces and this.verticalPieces to generate image
			_this.draw();
			_this.div.on('resize', _this.draw);
		}
	};
}

// Stores the HTMLDivElement that's using the 9patch image
NinePatch.prototype.div = null;
// Padding
NinePatch.prototype.padding = null;
// Stores the original background css color to use later
NinePatch.prototype.originalBG = null;
// Stores the pieces used to generate the horizontal layout
NinePatch.prototype.horizontalPieces = null;
// Stores the pieces used to generate the vertical layout
NinePatch.prototype.verticalPieces = null;
// Stores the 9patch image
NinePatch.prototype.bgImage = null;

// Gets the horizontal|vertical pieces based on image data
NinePatch.prototype.getPieces = function(data, staticColor, repeatColor) {
	var preType, curType, start, width, curColor, i, curPos;
	var pieces = new Array();

	curColor = rgba2Color(data[0], data[1], data[2], data[3]);
	preType = (curColor == staticColor ? 's' : (curColor == repeatColor ? 'r' : 'd'));
	start = 1;

	for (i = 4; i < data.length; i += 4) {
		curPos = i / 4 + 1;
		curColor = rgba2Color(data[i], data[i + 1], data[i + 2], data[i + 3]);
		curType = (curColor == staticColor ? 's' : (curColor == repeatColor ? 'r' : 'd'));
		if (preType !== curType) {
			// box changed colors
			width = curPos - start;
			pieces.push(new Array(preType, start, width));

			preType = curType;
			start = curPos;
		}
	}

	// push end
	width = curPos - start + 1; // the last pixel should be counted.
	pieces.push(new Array(preType, start, width));
	return pieces;
};

NinePatch.prototype.getBorderPadding = function(dataPad, pieces) {
	var staticColor = rgba2Color(dataPad[0], dataPad[1], dataPad[2], dataPad[3]);
	var pad = {begin: -1, end: -1};
	var i, curColor;

	// padding at beginning but skip the first pixel which is on the pdding border.
	var foundPadIndex = false;
	for (i = 4; i < dataPad.length; i += 4) {
		curColor = rgba2Color(dataPad[i], dataPad[i + 1], dataPad[i + 2], dataPad[i + 3]);
		if (curColor != staticColor) {
			foundPadIndex = true;
			break;
		}
	}
	if (foundPadIndex) {
		pad.begin = i / 4 - 1; // filter out the pixel on the padding border.
	} else {
		// There is no padding index on the border, the begin padding should equal to the first piece size,
		// while the end padding should equal to the last piece size.
		pad.begin = pieces[0][2];
		pad.end = pieces[pieces.length - 1][2];
		return pad;
	}

	// to here, there must be padding index on the border.
	// padding at end but skip the last pixel which is on the pdding border.
	for (i = dataPad.length - 8; i >= 0; i -= 4) {
		curColor = rgba2Color(dataPad[i], dataPad[i + 1], dataPad[i + 2], dataPad[i + 3]);
		if (curColor != staticColor) {
			break;
		}
	}
	pad.end = (dataPad.length - i) / 4 - 1;
	return pad;
};

// Function to draw the background for the given element size.
NinePatch.prototype.draw = function() {
	if (this.horizontalPieces === null) {
		return;
	}

	var canvas = document.createElement('canvas');
	canvas.width = this.div.width() + this.padding.left + this.padding.right;
	canvas.height = this.div.height() + this.padding.top + this.padding.bottom;

	var ctx = canvas.getContext('2d');
	var evenFillWidth, evenFillHeight;

	// Determine the width for the static and dynamic pieces
	var staticWidth = 0;
	var stretchCount = 0;
	for (var i = 0; i < this.horizontalPieces.length; i++) {
		if (this.horizontalPieces[i][0] === 's') {
			staticWidth += this.horizontalPieces[i][2];
		} else {
			stretchCount++;
		}
	}
	evenFillWidth = (canvas.width - staticWidth) / stretchCount;

	// Determine the height for the static and dynamic pieces
	var staticHeight = 0;
	stretchCount = 0;
	for (var i = 0; i < this.verticalPieces.length; i++) {
		if (this.verticalPieces[i][0] === 's') {
			staticHeight += this.verticalPieces[i][2];
		} else {
			stretchCount++;
		}
	}
	evenFillHeight = (canvas.height - staticHeight) / stretchCount;

	// Loop through each of the vertical/horizontal pieces and draw on the canvas
	var fillWidth, fillHeight;
	for (var i = 0; i < this.verticalPieces.length; i++) {
		for (var j = 0; j < this.horizontalPieces.length; j++) {

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
				var tempCanvas = document.createElement('canvas');
				tempCanvas.width = this.horizontalPieces[j][2];
				tempCanvas.height = this.verticalPieces[i][2];

				var tempCtx = tempCanvas.getContext('2d');
				tempCtx.drawImage(this.bgImage,
					this.horizontalPieces[j][1], this.verticalPieces[i][1],
					this.horizontalPieces[j][2], this.verticalPieces[i][2],
					0, 0,
					this.horizontalPieces[j][2], this.verticalPieces[i][2]);

				var tempPattern = ctx.createPattern(tempCanvas, 'repeat');
				ctx.fillStyle = tempPattern;
				ctx.fillRect(0, 0, fillWidth, fillHeight);
			}

			// Shift to next x position
			ctx.translate(fillWidth, 0);
		}

		// shift back to 0 x and down to the next line
		ctx.translate(-canvas.width, (this.verticalPieces[i][0] === 's' ? this.verticalPieces[i][2] : evenFillHeight));
	}

	// store the canvas as the div's background
	var encodedData = canvas.toDataURL("image/png");
	this.div.css('background', this.originalBgColor + ' url(' + encodedData + ') no-repeat');
	this.div.css('padding-left', this.padding.left);
	this.div.css('padding-right', this.padding.right);
	this.div.css('padding-top', this.padding.top);
	this.div.css('padding-bottom', this.padding.bottom);
};

NinePatch.prototype.drawCSS3 = function() {
	var ctx, canvas;
	canvas = document.createElement('canvas');
	ctx = canvas.getContext('2d');

	canvas.width = this.bgImage.width - 2;
	canvas.height = this.bgImage.height - 2;

	ctx.drawImage(this.bgImage, -1, -1);

	var encodedData = canvas.toDataURL("image/png");
	var pixPX = this.verticalPieces[0][2] + "px " + this.horizontalPieces[2][2] + "px " + this.verticalPieces[2][2] + "px " + this.horizontalPieces[0][2] + "px";
	var pix = this.verticalPieces[0][2] + " " + this.horizontalPieces[2][2] + " " + this.verticalPieces[2][2] + " " + this.horizontalPieces[0][2];
	this.div.css('border-width', pixPX);
	this.div.css('border-style', 'solid');
	this.div.css('padding', '0');
	this.div.css('border-image', 'url(' + encodedData + ') ' + pix + ' fill '
		+ (this.horizontalPieces[1][1] === 'r' ? 'repeat' : 'stretch') + ' '
		+ (this.verticalPieces[1][1] === 'r' ? 'repeat' : 'stretch'));
	// Take image and slice out border
}

window['NinePatch'] = NinePatch;
