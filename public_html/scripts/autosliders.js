//TODO Add function to redraw slider background after any value change
function slidersSum(sliders) {
    var sum = 0;
    $(sliders).each(function() {
        sum += parseInt($(this).val());
    })
    return sum;
}

function logSum(sliders, pretext='') {
    var sum = slidersSum(sliders);
    console.log(pretext+sum);
    return sum;
}

//from https://stackoverflow.com/questions/19269545/how-to-get-n-no-elements-randomly-from-an-array
function getRandom(arr, n) {
    let result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        let x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

/**
 * Makes sure that the sum of sliders' values is the one needed, randomly removing or adding small values to sliders
 * @param {jQuery} sliders sliders which need to be balanced 
 * @param {Number} availableTotal must be an integer
 */
function validate(sliders, availableTotal) {
    let sum = logSum(sliders, 'Starting sum is ');
    let delta = sum - availableTotal;
    if (delta === 0) return;
    console.log(delta + ' needs to go away');
    let filter;
    if (delta > 0) {
        filter = function () {
            return $(this).val() > parseInt($(this).attr('min'));
        };
    }
    else {
        filter = function () {return true;};
    }
    let targetSliders = $(sliders).filter(filter);
    while (Math.abs(delta) > targetSliders.length) {
        delta -= Math.sign(delta) * targetSliders.length;
        $(targetSliders).each(function() {
            $(this).val(parseInt($(this).val()) - Math.sign(delta));
        });
        targetSliders = $(targetSliders).filter(filter);
    }
    $(getRandom(targetSliders, Math.abs(delta))).each(function() {
        $(this).val(parseInt($(this).val()) - Math.sign(delta));
    });
    logSum(sliders, 'New sum is ')
}
var addEventListeners = function () {
    $('.slider-auto-reallocate-input').each(function() {
        $(this).on('input', function () {
            $(this).trigger('change'); // A workaround to make the slider update with each move, before the cursor is released
        });
        let slidersGroup = this.attributes.class.nodeValue.split(" ").pop();
        $(this).on('change', function () {
            let $this = $(this);
            let val = $this.val();
            let val_pct = (val - $this.attr('min')) / ($this.attr('max') - $this.attr('min')) * 100;

            if (val_pct < 0) {
                val_pct = 0;
            }
            // Adjust the css so the bar looks like it grows and shrinks
            let st = 'linear-gradient(to right, rgb(35, 175, 0) ' + val_pct + '%, white ' + val_pct + '%)';
            $this.css('background', st);
            let total = slidersSum('.slider-auto-reallocate-input.'+slidersGroup);

            let availableTotal = 1000;

            let delta = availableTotal - total;
            let slidersToFix = $('.slider-auto-reallocate-input.'+slidersGroup).not($this);
            if (delta < 0) {
                slidersToFix = slidersToFix.
                filter(function () {
                    return $(this).val() > parseInt($(this).attr('min'));
                })
            }

            let total_sliders = slidersToFix.length;
            let effectiveUnitChange = parseInt(delta/total_sliders);
            let effectiveChange = effectiveUnitChange*total_sliders;
            //How much should be distributed again to fix total sum issues
            let smallFix = delta - effectiveChange;
            slidersToFix.each(function () {
                let value = parseInt($(this).val());
                let new_val = value + effectiveUnitChange;

                let val_pct = (new_val - $this.attr('min')) / ($this.attr('max') - $this.attr('min')) * 100;

                if (val_pct < 0) {
                    val_pct = 0;
                }
                let st = 'linear-gradient(to right, rgb(35, 175, 0) ' + val_pct + '%, white ' + val_pct + '%)';
                $(this).css('background', st);

                if (new_val < 0 || $this.val() === availableTotal) {
                    new_val = 0;
                }
                else if (new_val > availableTotal) {
                    new_val = availableTotal;
                }
                $(this).val(new_val);
            });
        });
    });
};


function equalizeOptions(options) {
    let availableTotal = 1000;
    let portion = availableTotal / options.length;
    $(options).each(function () {
        $(this).val(portion);
        let val_pct = (portion / availableTotal)*100;
        if (val_pct < 0) {
            val_pct = 0;
        }
        let st = 'linear-gradient(to right, rgb(35, 175, 0) ' + val_pct + '%, white ' + val_pct + '%)';
        $(this).css('background', st);
    });
}

function equalize(group) {
    let availableTotal = 1000;
    let options = $(group).parent().find('.option-source');
    if (options.length > 0) {
        equalizeOptions(options);
        validate($('.slider-auto-reallocate-input.option-source'), availableTotal);
    }
    options = $(group).parent().find('.option-destination');
    if (options.length > 0) {
        equalizeOptions(options);
        validate($('.slider-auto-reallocate-input.option-destination'), availableTotal);
    }
}
//equalize on start to prevent visual issues on refresh
equalize($('#reset'));
$('#totalmarkers').val(400);
$('#totalmarkers').css('background', 'linear-gradient(to right, rgb(35, 175, 0) 40%, white 40%)');

//fill background of sliders
$('.pretty-slider').on('input', function() {
    let fill_percent = ($(this).val() - $(this).attr('min'))/($(this).attr('max') - $(this).attr('min'));
    let discrete_percent = fill_percent.toFixed(2)*100;
    let st = 'linear-gradient(to right, rgb(35, 175, 0) ' + discrete_percent + '%, white ' + discrete_percent + '%)';
    $(this).css('background', st);
});



