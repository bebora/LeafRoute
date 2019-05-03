$('.slider-auto-reallocate-input').each(function() {
    $(this).on('input', function () {
        var $this = $(this);
        $this.trigger('change'); // A workaround to make the slider update with each move, before the cursor is released
        
        var total_sliders = $('.slider-auto-reallocate-input').length;
        
        var val = $this.val();
        var val_pct = (val - $this.attr("min")) / ($this.attr('max') - $this.attr('min')) * 100;
        
        if (val_pct < 0) {
            val_pct = 0;
        }
        // Adjust the css so the bar looks like it grows and shrinks
        var st = 'linear-gradient(to right, rgb(35, 175, 0) ' + val_pct + '%, white ' + val_pct + '%)';
        $this.css('background', st);

        var total = 0;
        
        $('.slider-auto-reallocate-input').not($this).not('.locked').each(function () {
        
           total += parseInt($(this).val());
        });
        
        total += parseInt($this.val());
        
        var availableTotal = 1000;
        
        var delta = availableTotal - total;
        
        
        $('.slider-auto-reallocate-input').not($this).each(function () {
           var value = parseInt($(this).val());
           var new_val = value + (delta/(total_sliders -1));
           
           var val_pct = (new_val - $this.attr("min")) / ($this.attr('max') - $this.attr('min')) * 100;
           
           if (val_pct < 0) {
            val_pct = 0;
           }
           var st = 'linear-gradient(to right, rgb(35, 175, 0) ' + val_pct + '%, white ' + val_pct + '%)';
           $(this).css('background', st);

           if (new_val < 0 || $this.val() == 100) {
            new_val = 0;
           }
           if (new_val > availableTotal) {
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
}
//equalize on start to prevent visual issues on refresh
equalize($("#reset"));
$("#totalmarkers").val(400);
$("#totalmarkers").css('background', 'linear-gradient(to right, rgb(35, 175, 0) 40%, white 40%)');

//fill background of sliders
$('.pretty-slider').on('input', function() {
    var fill_percent = ($(this).val() - $(this).attr("min"))/($(this).attr("max") - $(this).attr("min"));
    var discrete_percent = fill_percent.toFixed(2)*100;
    var st = 'linear-gradient(to right, rgb(35, 175, 0) ' + discrete_percent + '%, white ' + discrete_percent + '%)';
    console.log(st);
    $(this).css('background', st);
});




