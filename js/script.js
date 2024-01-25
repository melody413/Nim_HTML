$(document).ready(function(){



	if ($('.pdf__box').length) {
		
		if ($(window).width()  < 480) {
			$('.pdf__box').pdfViewer('assets/newton.pdf',{
			  width: 480,
			  height: 300,
			});
		} else {
			$('.pdf__box').pdfViewer('assets/newton.pdf',{
			  width: 900,
			  height: 600,
			});
		}
	}

	$('.bigger__image').on('click' ,function(e){
		e.preventDefault();
		$('.overlay__image').fadeIn(300);
		$('body,html').css("overflow-y" ,"hidden");
		$('.overlay__image .inner__overlay>img').attr('src' , $(this).find('img').attr('src'));
	});
	$('.overlay__image>a').on('click' ,function(e){
		e.preventDefault();
		$(this).closest('.overlay__image').fadeOut(300);
		$('body,html').css("overflow-y" ,"initial");
	});


	if ($('.slider').length) {
		$('.slider').slick({
			slidesToShow:4,
			arrows:true,
			swipe:true,
			swipeToSlide:true,
			responsive: [
			    {
			      breakpoint: 991,
			      settings: {
			        slidesToShow: 3,
			      }
			    },
			    {
			      breakpoint: 600,
			      settings: {
			        slidesToShow: 2,
			      }
			    },
			    {
			      breakpoint: 480,
			      settings: {
			        slidesToShow: 1,
			        slidesToScroll: 1
			      }
			    }
			    // You can unslick at a given breakpoint now by adding:
			    // settings: "unslick"
			    // instead of a settings object
			  ]
		})
	}

	$('.menu__button>a').on("click" ,function(e){
		e.preventDefault();
		if ($(this).hasClass("opened")) {
			$(this).removeClass("opened")
			$("header .menu").css("top" ,"-100%");
			$('body,html').css("overflow-y" ,"initial");
		} else {
			$(this).addClass("opened");
			$("header .menu").css("top" ,"0px");
			$('body,html').css("overflow-y" ,"hidden");
		}
	});


	if ($('.dashboard__wrapper').length) {
		let totalHeightMedia = 0;
		let totalHeightBox = 0;
		$('.outer__dashboard>.elem__dash').each(function(index,elem){
			if (totalHeightMedia < $(elem).find(".media").outerHeight()) {
				totalHeightMedia = $(elem).find(".media").outerHeight();
			}
			if (totalHeightBox < $(elem).find(".desc").outerHeight()) {
				totalHeightBox = $(elem).find(".desc").outerHeight();
			}
		});
		$('.elem__dash>.media').css("min-height" , totalHeightMedia + "px");
		$('.elem__dash>.desc').css("min-height" , totalHeightBox + "px");
	}
	$(window).on('resize' ,function(){
		if ($('.dashboard__wrapper').length) {
			let totalHeightMedia = 0;
			let totalHeightBox = 0;
			$('.elem__dash>.media').css("min-height" , "0px");
			$('.outer__dashboard>.elem__dash').each(function(index,elem){
				if (totalHeightMedia < $(elem).find(".media").outerHeight()) {
					totalHeightMedia = $(elem).find(".media").outerHeight();
				}
				if (totalHeightBox < $(elem).find(".desc").outerHeight()) {
					totalHeightBox = $(elem).find(".desc").outerHeight();
				}
			});
			$('.elem__dash>.media').css("min-height" , totalHeightMedia + "px");
			$('.elem__dash>.desc').css("min-height" , totalHeightBox + "px");
		}
	});
});