'use strict'

const $ = makeElm;
const $svg = makeSVGElm;
const $cal = document.getElementById('cal');
const fixed_location = null; //[42.298, -71.219];

function update_position (callback) {
	if (fixed_location)
		callback(2, fixed_location[0], fixed_location[1]);
	else {
		chrome.storage.local.get(['geo'], function(res) {
			if (res.geo) {
				console.log('Retrieved [' + res.geo.latitude + ',' + res.geo.longitude + ']');
				callback(3, res.geo.latitude, res.geo.longitude);
			}
			if ("geolocation" in navigator)
				navigator.geolocation.getCurrentPosition(function(position) {
					let latitude = position.coords.latitude;
					let longitude = position.coords.longitude;
					console.log('Received [' + latitude + ',' + longitude + ']');
					chrome.storage.local.set({geo: {latitude : latitude, longitude: longitude}}, function() {
					        console.log('Saved [' + latitude + ',' + longitude + ']');
					});
					callback(1, latitude, longitude);
		        });
			else
				callback (0, null, null);
		});
	}
}

let locale, hco;
function set_locale (nl) {
	chrome.storage.local.set({locale: nl}, function() {
		console.log('Saved locale = ', nl);
	});
	locale = nl;
	hco = locale.substr(0,1);
	$cal.setAttribute('dir', (locale == 'he')? 'rtl': 'ltr');
}

function wday (n) {
	const weekdays = [
	{en: "S"},
	{en: "M"},
	{en: "T"},
	{en: "W"},
	{en: "T"},
	{en: "F"},
	{en: "S"}];

	if (locale == 'en')
		return weekdays[n][locale];
	else if (locale == 'he')
		return Hebcal.gematriya(n + 1);
}

function mday (n) {
	if (locale == 'en')
		return 1 + n;
	else if (locale == 'he')
		return Hebcal.gematriya(n + 1);
}

function $lang(callback) {
	const $ctrl = $('span', {}, (locale == 'en')? "EN" : "HB");
	make_active($ctrl, function () {
		set_locale((locale == 'en')? 'he' : 'en');
		callback ();
	});
	return $ctrl;
}

function $svgphase (phase, size) {
	//E.g.: phase = SunCalc.getMoonIllumination(m.days[ii].greg()).phase;
	//const dark = "rgb(255, 255, 255)";
	const dark = "rgb(0, 0, 0)";
	const vis = "rgb(196, 196, 215)";
	let a, b, r;
	let p = phase;

	if (Math.abs(p - 0.25) < 0.001)
		p = 0.2499;
	if (Math.abs(p - 0.75) < 0.001)
		p = 0.7501;

	if (p < 0.25) {
		a = 0;
		b = 1;
		r = 100/(1 - 4 * p);
	}
	else if (p < 0.5) {
		a = 0;
		b = 0;
		r = 100/(4 * p - 1);
	}
	else if (p < 0.75) {
		a = 1;
		b = 1;
		r = 100/(3 - 4 * p);
	}
	else {
		a = 1;
		b = 0;
		r = 100/(4 * p - 3);
	}

	return $svg('svg', {viewBox: "0 0 200 200" , width: size, height: size, style: "position: relative; top: 7px"},
	//$svg('circle', {style: "fill: " + dark + ";", cx: "100", cy: "100", r: "100"}),
	$svg('path', {style: "fill: " + vis + ";",
  		d: "M 100 200 A 100 100 0 0 " + a + " 100 0 A " + r + " " + r + " 0 0 " + b + " 100 200"}));
}

function make_active($target, callback) {
	$target.addEventListener('click', function () {
		callback();
	});
	$target.addEventListener('mouseover', function () {
		$target.classList.add("active");
		$target.style.cursor = 'crosshair';
	});
	$target.addEventListener('mouseout', function () {
		$target.classList.remove("active");
		$target.style.cursor = 'default';
	});
}

function $month (m) {
	const rows = [$('tr', {}, ...[...Array(7).keys()].map (x => $('td', {align: 'center', class: 'wday'}, wday(x))))];
	const hrows = [];
	const today = Hebcal.HDate();

	let pos = m.days[0].getDay();
	let row = [...Array(pos).keys()].map (x => $('td', {}, "&nbsp;"));

	const $stat_day = $('span', {});
	const set_stat_day = function (hd) {
		eraseChildren($stat_day);
		appendChildren($stat_day,
			$('img', {height: '25pt', src: '/icons/Ic_today_48px.svg', style: "position: relative; top: 7px"}),
			hd.toString(hco),
			$('span', {}, "&#xFF5C;&lrm;" + moment(hd.greg()).format('MMM-D, YYYY')+ " &rlm;"));
	}
	set_stat_day(today);
	make_active($stat_day, function () {
		set_view_month(new Hebcal.Month(today.getMonth(), today.getFullYear()));
	});

	const $stat_phase = $('span', {});
	const set_stat_phase = function (hd) {
		eraseChildren($stat_phase);
		appendChildren($stat_phase,
			$svgphase(SunCalc.getMoonIllumination(hd.greg()).phase, "20pt"));
	}
	set_stat_phase(today);

	const $stat_location = $('span', {});
	const set_stat_location = function (status, latitude, longitude) {
		let disp = "N/A"
		if (status > 0)
			disp = latitude.toFixed(3) + ", " + longitude.toFixed(3);

		eraseChildren($stat_location);
		appendChildren($stat_location,
			$('img', {height: '25pt', src: (status == 1)?'/icons/location.svg' : '/icons/location_y.svg', style: "position: relative; top: 7px"}),
			$('span', {}, "&lrm; " + disp + " &rlm;"));
	}
	set_stat_location(0);

	let sun_lat = null, sun_lon = null;
	const $stat_sun = $('span', {});
	const set_stat_sun = function (hd) {
		eraseChildren($stat_sun);
		if (sun_lat && sun_lon) {
			const sun = SunCalc.getTimes(hd.greg(), sun_lat, sun_lon);
			appendChildren($stat_sun,
				$('img', {height: '25pt', src: '/icons/sunrise.svg', style: "position: relative; top: 7px"}),
					" " + moment(sun.sunrise).format('H:mm') + " ",
					$('img', {height: '25pt', src: '/icons/sunset.svg', style: "position: relative; top: 7px"}),
					" " + moment(sun.sunset).format('H:mm') + " ");
		}
	}

	update_position(function (status, latitude, longitude) {
		set_stat_location(status, latitude, longitude);
		if (status > 0) {
			sun_lat = latitude;
			sun_lon = longitude;
		}
		set_stat_sun(today);
	})

	for (let ii = 0; ii < m.days.length; ii ++) {
		let holidays = m.days[ii].holidays(false).map(x => x.getDesc(hco)).join(' | ');
		if (locale == 'he')
			holidays = holidays.replace('(','{0}').replace(')','{1}').replace('{0}',')').replace('{1}','(');
		let $hday = null;
		if (holidays) {
			$hday = $('tr', {},
				$('td', {}, mday(ii)),
				$('td', {}, moment(m.days[ii].greg()).format('MMM-D')),
				$('td', {}, holidays));
			hrows.push($hday);
		}

		let clazz = [];
		if (holidays)
			clazz.push('holiday');
		if (pos % 7 == 6)
			clazz.push('shabbat');
		if (m.days[ii].abs() == today.abs())
			clazz.push('today');

		const $day = $('td',
			{class: clazz.join(' '), align: 'center', style: "position: relative;"},
			mday(ii));
		$day.addEventListener ('mouseover', function () {
			$day.classList.add("highlight");
			if ($hday)
				$hday.classList.add("highlight");
			set_stat_day(m.days[ii]);
			set_stat_sun(m.days[ii]);
			set_stat_phase(m.days[ii]);
		});
		$day.addEventListener ('mouseout', function () {
			$day.classList.remove("highlight");
			if ($hday)
				$hday.classList.remove("highlight");
			set_stat_day(today);
			set_stat_sun(today);
			set_stat_phase(today);
		});
		if ($hday) {
			$hday.addEventListener ('mouseover', function () {
				$day.classList.add("highlight");
				$hday.classList.add("highlight");
			});
			$hday.addEventListener ('mouseout', function () {
				$day.classList.remove("highlight");
				$hday.classList.remove("highlight");
			});
		}

		row.push($day);

		pos ++;
		if (pos % 7 == 0) {
			rows.push($('tr', {}, ...row));
			if (ii < m.days.length - 1)
				row = [];
		}
		else if (ii == m.days.length - 1) {
			row.push(...[...Array(7 - pos % 7).keys()].map (x => $('td', {}, "&nbsp;")));
			rows.push($('tr', {}, ...row));
		}
	}

	let caption = m.getName(hco) + " | ";
	if (locale == 'en')
		caption += m.days[0].getFullYear();
	else
		caption += Hebcal.gematriya(m.days[0].getFullYear());

	caption += " | " + moment(m.days[0].greg()).format('YYYY');
	if (m.days[m.days.length - 1].greg().getYear() > m.days[0].greg().getYear())
		caption += "-" + moment(m.days[m.days.length - 1].greg()).format('YYYY');

	let aleft = (locale == 'en')? 'left' : 'right';
	let aright = (locale == 'en')? 'right' : 'left';
	let pleft = (locale == 'en')? '&#8676;' : '&#8677;';
	let pright = (locale == 'en')? '&#8677;' : '&#8676;';

	let $left = $('td', {align: aleft}, pleft);
	make_active($left, function() {
		set_view_month(m.prev());
	});
	let $right = $('td', {align: aright}, pright);
	make_active($right, function() {
		set_view_month(m.next());
	});

	const $caption = $('td', {align: 'center'}, caption);
	make_active($caption, function () {
		set_view_year(Hebcal(m.year));
	});

	return $('div', {},
	$('table', {},
		$('tr', {},
			$('td', {colspan: 4},
				$('table', {width: '100%'},
					$('tr', {class: 'header'},
						$left,
						$caption,
						$right)))),
		$('tr', {},
			$('td', {valign: 'top', style: 'margin-right: 20px'},
				$('table',{border: 0, cellspacing: 2, cellpadding: 2, style: "border-collapse: collapse"}, ...rows)),
			$('td', {width: '10px'}, "&nbsp;"),
			$('td', {width: '10px', style: 'border-' + aleft + ': 1px solid rgb(128,128,128)'}, "&nbsp;"),
			$('td', {valign: 'top'},
				$('table', {border: 0, class: 'holidays'},	...hrows)))),
	$('table', {border: 0},
		$('tr', {class: 'status'},
			$('td', {},
				$stat_sun,
				$stat_day,
				$stat_location,
				" ",
				$stat_phase,
				$lang(function () {set_view_month(m);})
				))));
}

function $monthmin(m, incl_hdr) {
	const rows = incl_hdr? [$('tr', {}, ...[...Array(7).keys()].map (x => $('td', {align: 'center', class: 'wday'}, wday(x))))] : [];
	const hrows = [];
	const today = Hebcal.HDate();
	let pos = m.days[0].getDay();
	let row = [...Array(pos).keys()].map (x => $('td', {}, "&nbsp;"));

	for (let ii = 0; ii < m.days.length; ii ++) {
		let clazz = [];
		if (m.days[ii].holidays(false).length > 0)
			clazz.push('holiday');
		if (pos % 7 == 6)
			clazz.push('shabbat');
		if (m.days[ii].abs() == today.abs())
			clazz.push('today');

		const $day = $('td',
			{class: clazz.join(' '), align: 'center', style: "position: relative;"},
			mday(ii));

		row.push($day);

		pos ++;
		if (pos % 7 == 0) {
			rows.push($('tr', {}, ...row));
			if (ii < m.days.length - 1)
				row = [];
		}
		else if (ii == m.days.length - 1) {
			row.push(...[...Array(7 - pos % 7).keys()].map (x => $('td', {}, "&nbsp;")));
			rows.push($('tr', {}, ...row));
		}
	}
	return $('table', {class: 'monthmin'}, ... rows);
}

function $year (y) {
	const rows = [];
	let row = [];
	const columns = 3;
	const thism = this_month ();

	let months = y.months.slice(0,y.months.length);
	months.sort(function(a,b) { return a.days[0].abs() - b.days[0].abs() });
	let pos = 0;
	for (const m of months) {
		const clazz = (m.days[0].abs() == thism.days[0].abs())? "this_month" : "plain";
		const $m = $('td', {valign: 'top', align: 'center', class: clazz},
			$('div', {class: 'h'}, m.getName(hco)),
			$('div', {class: 'e'},
				moment(m.days[0].greg()).format('MMM-D') +
				' &ndash; ' +
				moment(m.days[m.days.length-1].greg()).format('MMM-D')),
			$monthmin(m, pos < columns));
		make_active($m, function () {
			set_view_month(m);
		});

		row.push($m);
		if ((1 + pos) % columns == 0) {
			rows.push($('tr', {}, ...row));
			if (pos < months.length - 1)
				row = []
		}
		else if (pos == months.length - 1) {
			row.push(...[...Array(columns - 1 - pos % columns).keys()].map (x => $('td', {}, "&nbsp;")));
			rows.push($('tr', {}, ...row));
		}
		pos ++;
	}

	const day0 = months[0].days[0];
	const gy = parseInt(moment(day0.greg()).format('YYYY'));
	let caption;
	if (locale == 'en')
		caption = day0.getFullYear();
	else
		caption = Hebcal.gematriya(day0.getFullYear());
	caption += "&#xFF5C;&lrm;" + gy + "-" + (1 + gy) + "&rlm;";
	const $caption = $('td', {align: 'center'}, caption);
	make_active($caption, function () {
		set_view_metoniccycle(y.year);
	});

	let aleft = (locale == 'en')? 'left' : 'right';
	let aright = (locale == 'en')? 'right' : 'left';
	let pleft = (locale == 'en')? '&#8676;' : '&#8677;';
	let pright = (locale == 'en')? '&#8677;' : '&#8676;';

	let $left = $('td', {align: aleft}, pleft);
	make_active($left, function() {
		set_view_year(y.prev());
	});
	let $right = $('td', {align: aright}, pright);
	make_active($right, function() {
		set_view_year(y.next());
	});

	return $('div', {},
	$('table', {border: 0, class: 'year'},
		$('tr', {},
			$('td', {colspan: columns},
				$('table', {width: '100%'},
					$('tr', {class: 'header'},
						$left,
						$caption,
						$right)))),
		...rows),
	$('table', {border: 0},
		$('tr', {class: 'status'},
			$('td', {},
				$lang(function () {set_view_year(y);})
				))));
}

function $metoniccycle(ynum) {
	const rows = [];
	let row = [];

	let aleft = (locale == 'en')? 'left' : 'right';
	let aright = (locale == 'en')? 'right' : 'left';
	let pleft = (locale == 'en')? '&#8676;' : '&#8677;';
	let pright = (locale == 'en')? '&#8677;' : '&#8676;';

	let $left = $('td', {align: aleft}, pleft);
	make_active($left, function() {
		set_view_metoniccycle(ynum - 19);
	});
	let $right = $('td', {align: aright}, pright);
	make_active($right, function() {
		set_view_metoniccycle(ynum + 19);
	});

	const sely = ynum;

	for (let yi = ynum - 9; yi <= ynum + 9; yi ++) {
		const gy = yi - 3761;
		if (yi == sely)
			row.push($left);
		const y19 = yi % 19;
		const leap = y19==0||y19== 3||y19==6||y19==8||y19==11||y19==14||y19==17;
		// Must be equal to Hebcal(yi).days().length
		const dayscnt = daysperyear[yi - 1] + (leap? 382: 352);

		const $ytd = $('td', {align: 'center', class: "x" + dayscnt},
			$('div', {class: 'h'},
				(locale == 'en')? yi: Hebcal.gematriya(yi)),
			$('div', {class: 'g'}, "" + gy + "-" + (1+gy)));
		make_active($ytd, function () {
			set_view_year(new Hebcal(yi));
		});
		row.push($ytd);
		if (yi == sely)
			row.push($right);
		if (row.length == 3) {
			rows.push($('tr', {class: (yi == sely)? "current" : "plain"}, ...row))
			row = [];
		}
	}
	return $('div', {},
	$('table', {class: 'metonic'},
			...rows),
	$('table', {border: 0},
		$('tr', {class: 'status'},
			$('td', {},
				$lang(function () {set_view_metoniccycle(ynum);})
				))));
}

function set_view_month (m) {
	eraseChildren($cal);
	$cal.appendChild($month(m));
}

function set_view_year (y) {
	eraseChildren($cal);
	$cal.appendChild($year(y));
}

function set_view_metoniccycle (y) {
	eraseChildren($cal);
	$cal.appendChild($metoniccycle(y));
}

function this_month () {
	let today = new Hebcal.HDate();
	let m = new Hebcal.Month(today.getMonth(), today.getFullYear());
	return m;
}

chrome.storage.local.get(['locale'], function(res) {
	if (res.locale) {
		console.log("Retrieved locale = ", res.locale);
		locale = res.locale;
	}
	else {
		locale = 'en';
		console.log("locale set to default = ", locale);
	}
	set_locale(locale);
	set_view_month(this_month());
	//let y = new Hebcal();
	//set_view_year(y);
	//set_view_metoniccycle(y.year);
});

