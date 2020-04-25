/**
 * 전역변수 선언
 */
;(function (win, doc) {
	win.$win = $(win);
	win.$doc = $(doc);

	$win.body = $doc.find('body');
	$win.menuBtn = $doc.find('.btn_menu');
	$win.menu = $doc.find('#menu');
	$win.utils = null;
	$win.zoom = null;
	$win.currtActiveDialog = null; // 현재 활성화 되어 있는 팝업의 jQuery.Object
	$win.options = {
		defaultScrollSpeed: 500,
		defaultViewPort: 2560,
		defaultZoom: 0.75,
	};
})(window, document);

/**
 * 공통 유틸
 */
;(function () {
	$win.utils = {		
		// 특정요소가 있는 위치로 이동
		moveTo: function (targetId, speed) {
			var $target = $(targetId);
			
			// 타겟이 없으면 함수 종료
			if ($target.length === 0) {
				return;
			}
			
			// 별도로 스피드값을 지정하지 않으면 디폴트 300
			if (!speed) {
				speed = 400;
			}

			// zoom속성이 적용된 비율에 맞게 스크롤위치 계산
			var posY = $target.offset().top;
			// debugger
			// 스크롤 이동
			$('html, body').animate({'scrollTop': posY}, speed);
		},
		//메뉴를 열고 닫는다
		toggleMene: function (haveExtended, speed) {
			if (haveExtended) { // 메뉴를 열다
				$win.menuBtn.attr('aria-expanded', true);
				$win.menu.stop().slideDown(speed, function (e) { 
					$win.menu.attr('style', 'display:block'); 
				});
			} else { //메뉴를 닫는다
				$win.menuBtn.attr('aria-expanded', false);
				$win.menu.stop().slideUp(speed, function (e) { 
					$win.menu.attr('style', ''); 
				});
			}
		},
		// 지정된 형식의 값만 입력가능하도록 제어
		checkInputValue: function ($el, type) {
			var value = $el.val();
			var regExp = '';

			switch (type) {
				case 'text':					
					regExp = /[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9!@#$%^&()*\,\.\\\|\-\_]/gi;
					break;
				case 'tel':					
					regExp = /[^0-9]/gi;
				break;	
			}	

			if (regExp.test(value)) {
				$el.val($el.data('data-value'));
			} else {
				$el.data('data-value', value);
			}
		},
		// 특정 팝업을 활성화시킨다.
		openDialog: function (targetIndex, setting) {
			// 이벤트객체가 있다면 기본 기능 막기
			if (event) {
				event.preventDefault();
			}
			
			var $dialog = $('.dialog_wrapper[data-index=' + targetIndex + ']'); // 타겟 팝업
			var options	= {
				beforeOpenEventHn: null, // 팝업이 활성화 되기전에 실행될 함수
				afterOpenEventHn: null, // 팝업이 활성화 된 후 실행될 함수
				beforeCloseEventHn: null, // 팝업이 비활성화 되기 전에 실행될 함수
				afterCloseEventHn: null // 팝업이 비활성화 된 후에 실행될 함수
			};

			// 타겟 팝업이 없으면 함수 종료
			if ($dialog.length === 0) {
				return;
			}
			
			// 세팅 값이 있으면 기존 옵션값을 업데이트
			if (setting) {
				options = $.extend(options, setting);
			}
			
			// 이미 활성화된 팝업이 있다면
			if ($win.currtActiveDialog) {
				$win.currtActiveDialog.hide(); // 기존에 활성화된 팝업 닫기
				$win.off('click.closedialog');
			}
			
			if (typeof options.beforeOpenEventHn === 'function') {
				options.beforeOpenEventHn($dialog);
			}		

			// 팝업 활성화
			$dialog.show(0, function () {
				$win.currtActiveDialog = $dialog; // 현재 활성화 된 팝업 바꾸기

				if (typeof options.afterOpenEventHn === 'function') {
					options.afterOpenEventHn($dialog);
				}
			});
			
			// 팝업 닫기
			$doc.on('click.closedialog', '.btn_confirm, .btn_close', function (e) {
				e.preventDefault();
				
				if (typeof options.beforeCloseEventHn === 'function') {
					options.beforeOpenEventHn($dialog);
				}

				$dialog.hide(0, function () {
					$win.currtActiveDialog = null;
					$doc.off('click.closedialog');
					if (typeof options.afterCloseEventHn === 'function') {
						options.afterCloseEventHn($dialog);
					}
				});
			});
		},
		openVideoDialog: function (targetIndex, videoId) {
			$win.utils.openDialog(targetIndex, {
				beforeOpenEventHn: function ($dialog) {
					$dialog.find('iframe').attr('src', 'https://www.youtube.com/embed/' + videoId + '?rel=0&amp;autoplay=1&amp;showinfo=0');
				},
				afterCloseEventHn: function ($dialog) {
					$dialog.find('iframe').attr('src', '');
				}
			});
		}
	}
})();

/**
 * 이벤트 바인드
 */
;(function () {
	var $gnbItems = $('.gnb').find('a');
	
	// 미디어 영역 스와이프 기능
	;(function () {
		var $swiperWraper = $('#media .swiper_wrap');		
		var $slides = $swiperWraper.find('.slide');
		
		// 슬라이드가 4개 미만이면 스와이프를 적용하지 않는다
		if ($slides.length < 4) {
			return;
		}
		
		// 이전, 다음 버튼 show 및 객체 셀렉터
		var $nextButton = $swiperWraper.find('.btn_next').fadeIn(500);
		var $prevButton = $swiperWraper.find('.btn_prev').fadeIn(500);
		
		// swiper 인스턴스 생성
		window.swiper = new Swiper($swiperWraper, {
			wrapperClass: 'swiper',
			slideClass: 'slides',
			slidesPerView: 'auto',
			nextButton: $nextButton,
			prevButton: $prevButton,
			loop: true
		});
	})();

	// 팝업 활성화
	$('[data-haspopup]').on('click', function (e) {
		var index = Number($(this).attr('data-haspopup'));

		if (index === 16) {
			$win.utils.openVideoDialog(index, $(this).attr('data-video')); 
		} else {
			$win.utils.openDialog(index);
		}
	});

	$win.menuBtn.on('click', function (e) {
		var isExtended = $(this).attr('aria-expanded');

		if (isExtended === 'true') { // 축소시키기
			$win.utils.toggleMene(false);
		} else { // 확장시키기
			$win.utils.toggleMene(true);
		}
	});

	// 로고를 클릭했을때 최상단으로 이동
	$('.logo').on('click', function (e) {
		e.preventDefault();

		$win.utils.moveTo('body');
		$win.utils.toggleMene(false);
	});

	// GNB 메뉴를 클릭했을때 해당 메뉴영역으로 이동
	$('.gnb').on('click', 'a', function (e) {
		e.preventDefault();

		var targetId = $(e.currentTarget).attr('href');
		$win.utils.moveTo(targetId);
		$win.utils.toggleMene(false);
	});

	//메인페이지 사전등록버튼 클릭시 사전등록페이지로 스크롤 이동
	$('.main .btn_register').on('click', function (e) {
		e.preventDefault();

		var targetId = $(this).attr('href');
		$win.utils.moveTo(targetId);
	});

	//inp_text
	$('.inp_text').on('keyup change', 'input', function (e) {
		var type = $(this).attr('type');

		$win.utils.checkInputValue($(this), type);		
	});

	/* [S]추후 사전등록 종료시 아래 코드 삭제 */
	$win.on('scroll', function () {
		var scrollTop = $win.scrollTop();
		var $target = $('#register');
		var startPosY = $target.offset().top;
		var stopPosY  = startPosY + $target.height();

		if(startPosY< scrollTop && scrollTop < stopPosY){
			var count = Number($('.box_reward').attr('data-count'));

			if (count < 10000) {
				count = 0;						
			} else if (count < 20000) { // 19999명까지 - 1만명 달성
				count = 1;
			} else if (count < 30000) { // 29999명까지 - 2만명 달성
				count = 2;
			} else if (count < 50000) { // 49999명까지 - 3만명 달성
				count = 3;
			} else { // 5만명 달성
				count = 4;
			}

			$('.box_reward').addClass('attainment' + count);			
		}
	});
	$win.load(function () {
		$win.trigger('scroll');
	});
	/* [E]추후 사전등록 종료시 아래 코드 삭제 */		
})();

