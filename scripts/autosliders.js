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
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

/**
 * 
 * @param {jQuery} sliders sliders which need to be balanced 
 * @param {Number} availableTotal must be an integer
 */
function validate(sliders, availableTotal) {
    var sum = logSum(sliders, 'Starting sum is ');
    var delta = sum - availableTotal;
    if (delta == 0) return;
    console.log(delta + ' needs to go away');
    var filter;
    if (delta > 0) {
        filter = function () {
            return $(this).val() > parseInt($(this).attr('min'));
        };
    }
    else {
        filter = function () {return true;};
    }
    var targetSliders = $(sliders).filter(filter);
    while (Math.abs(delta) > targetSliders.length) {
        delta -= Math.sign(delta) * targetSliders.length;
        $(targetSliders).each(function() {
            $(this).val(parseInt($(this).val()) - Math.sign(delta));
        })
        targetSliders = $(targetSliders).filter(filter);
    }
    $(getRandom(targetSliders, Math.abs(delta))).each(function() {
        $(this).val(parseInt($(this).val()) - Math.sign(delta));
    })
    logSum(sliders, 'New sum is ')
}
$('.slider-auto-reallocate-input').each(function() {
    $(this).on('input', function () {
        $(this).trigger('change'); // A workaround to make the slider update with each move, before the cursor is released
    })

    $(this).on('change', function () {
        var $this = $(this);
        var val = $this.val();
        var val_pct = (val - $this.attr('min')) / ($this.attr('max') - $this.attr('min')) * 100;
        
        if (val_pct < 0) {
            val_pct = 0;
        }
        // Adjust the css so the bar looks like it grows and shrinks
        var st = 'linear-gradient(to right, rgb(35, 175, 0) ' + val_pct + '%, white ' + val_pct + '%)';
        $this.css('background', st);

        var total = slidersSum('.slider-auto-reallocate-input');
        
        var availableTotal = 1000;
        
        var delta = availableTotal - total;
        var slidersToFix = $('.slider-auto-reallocate-input').not($this);
        if (delta < 0) {
            slidersToFix = slidersToFix.
            filter(function () {
                return $(this).val() > parseInt($(this).attr('min'));
            })
        }

        var total_sliders = slidersToFix.length;
        var effectiveUnitChange = parseInt(delta/total_sliders);
        var effectiveChange = effectiveUnitChange*total_sliders;
        //How much should be distrubuted again to fix total sum issues
        var smallFix = delta - effectiveChange;
        slidersToFix.each(function () {
            var value = parseInt($(this).val());
            var new_val = value + effectiveUnitChange;
        
            var val_pct = (new_val - $this.attr('min')) / ($this.attr('max') - $this.attr('min')) * 100;
           
            if (val_pct < 0) {
                val_pct = 0;
            }
            var st = 'linear-gradient(to right, rgb(35, 175, 0) ' + val_pct + '%, white ' + val_pct + '%)';
            $(this).css('background', st);

            if (new_val < 0 || $this.val() == availableTotal) {
                new_val = 0;
            }
            else if (new_val > availableTotal) {
                new_val = availableTotal;
            }
            $(this).val(new_val);
        });
    });
});

function equalize(group) {
    var options = $(group).parent().find('.option');
    var availableTotal = 1000;
    var portion = availableTotal / options.length;
    $(options).each(function () {
        $(this).val(portion);
        var val_pct = (portion / availableTotal)*100;
        if (val_pct < 0) {
            val_pct = 0;
        }
        var st = 'linear-gradient(to right, rgb(35, 175, 0) ' + val_pct + '%, white ' + val_pct + '%)';
        $(this).css('background', st);
    });
    validate($('.slider-auto-reallocate-input'), availableTotal);
}
//equalize on start to prevent visual issues on refresh
equalize($('#reset'));
$('#totalmarkers').val(400);
$('#totalmarkers').css('background', 'linear-gradient(to right, rgb(35, 175, 0) 40%, white 40%)');

//fill background of sliders
$('.pretty-slider').on('input', function() {
    var fill_percent = ($(this).val() - $(this).attr('min'))/($(this).attr('max') - $(this).attr('min'));
    var discrete_percent = fill_percent.toFixed(2)*100;
    var st = 'linear-gradient(to right, rgb(35, 175, 0) ' + discrete_percent + '%, white ' + discrete_percent + '%)';
    $(this).css('background', st);
});



