// document.addEventListener('DOMContentLoaded', function() {
//     var $range = $(".js-range-slider"),
//         $inputFrom = $(".js-input-from"),
//         $inputTo = $(".js-input-to"),
//         $minPrice = $(".js-min-price"),
//         $maxPrice = $(".js-max-price"),
//         instance,
//         min = 500,
//         max = 70000,
//         from = min,
//         to = 50000;

//     $range.ionRangeSlider({
//         type: "double",
//         min: min,
//         max: max,
//         from: from,
//         to: to,
//         prefix: 'tk. ',
//         onStart: updateInputs,
//         onChange: updateInputs,
//         step: 1,
//         prettify_enabled: true,
//         prettify_separator: ".",
//         values_separator: " - ",
//         force_edges: true
//     });

//     instance = $range.data("ionRangeSlider");

//     function updateInputs(data) {
//         from = data.from;
//         to = data.to;

//         $inputFrom.val(from);
//         $inputTo.val(to);
//         $minPrice.val(from);
//         $maxPrice.val(to);
//     }

//     $inputFrom.on("input", function() {
//         var val = parseInt($(this).val(), 10);

//         if (val < min) {
//             val = min;
//         } else if (val > max) {
//             val = max;
//         }

//         instance.update({
//             from: val
//         });
//     });

//     $inputTo.on("input", function() {
//         var val = parseInt($(this).val(), 10);

//         if (val < min) {
//             val = min;
//         } else if (val > max) {
//             val = max;
//         }

//         instance.update({
//             to: val
//         });
//     });
// });
