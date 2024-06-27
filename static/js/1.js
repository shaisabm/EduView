// general, for app & ops & web

beta=cookie('beta')||0;
function switchbeta() {
	beta=(beta)? 0:1;
	savecookie('beta',beta||'');
	go();
}


// INIT

touchos=(self.platform=='iOS' || self.platform=='Android');  // independent of $touch which applies to spacing only
if(!self.mini) mini=0;
lastact=Date.now();

// Remove hover css for touch
if(touchos) {
	window.addEventListener('load',function() {
		var o;
		for(s=document.styleSheets.length-1; s>=0; s--) {
			try {o=document.styleSheets[s].cssRules || document.styleSheets[s].rules;}
			catch(e) {continue;}
			if(!o) continue;  // external font
			for(r=0; r<o.length; r++) {
				if(!o[r].selectorText || o[r].selectorText.indexOf(':hover')<0) continue;
				x=o[r].selectorText.split(',');
				y='';
				for(i=0; i<x.length; i++)
					if(x[i].indexOf(':hover')<0) y+=', '+x[i];
				o[r].selectorText=y.substr(2) || 'xxx';
			}
		}
	});
}


// UTILITIES

function el(id) {
	return document.getElementById(id);
}

function inp(id) {  // form input, usually hidden
	if(isNaN(id-0) && document.form1) return document.form1.elements[id];  // '12' returns the 12th element, so ignore quoted numbers
}

// return value of form input
function val(id,string,errok) {
	var o=inp(id);
	if(!o) {logerr('val('+id+') no such input',errok); return null;}
	var v=o.value;
	if(!string && typeof(v)=='string' && v===String(v-0)) return v-0;  // return number instead of string (default)
	else return v;
}

///temp patch state reporting scripts
function text(id,errok) {
	///logit("text("+id+") obsolete");
	var v=val(id,true,errok);
	if(v==='0') v=0;
	return v;
}

///temp patch state reporting scripts
function number(x,format) {
	var f='0123456789.';
	if(format.indexOf('-')>=0) f+='-';
	var y=filter(x+'',f);  // remove any chars not allowed, like commas
	if(y-0!=y || y=='') return '';  // NaN
	if(format.indexOf('.')<0) y=Math.round(y);  // round integers
	if(format.indexOf('+')>=0 && y>0) y='+'+y;  // show positive sign
	if(format.indexOf('%')>=0) y += '%';  // show percent sign
	return y;
}


// set value of form input; return true if input exists, else null
function setval(id,x,errok) {
	var o=inp(id);
	if(!o) return logerr('setval('+id+','+x+') no such input',errok);
	o.value=x;
	if(self.watchinputs && typeof(hidinputs[id])=='string')  /// cannot test !==undefined because any array x['find'] = function. weird.
		hidinputs[id]=String(x);
	return true;
}

// set value of form input; if doesn't exist insert as hidden input
function postval(id,x) {
	var o=inp(id);
	if(o) o.value=x;
	else {
		document.form1.insertAdjacentHTML('beforeend','<input type=hidden name="'+id+'">\n');  // &quot; handling is strange, so set value separately
		inp(id).value=x;
	}
	if(self.watchinputs && typeof(hidinputs[id])=='string')  /// cannot test !==undefined because any array x['find'] = function. weird.
		hidinputs[id]=String(x);
}

// set innerhtml of element; retun true if exists, else null
function sethtml(id,x,errok) {
	var o=el(id);
	if(!o) return logerr('sethtml('+id+','+html(x).substr(0,100)+') no such id',errok);
	o.innerHTML=x;
	return true;
}

// return innerhtml of element, null if doesnt exist
function gethtml(id,errok) {
	var o=el(id);
	if(!o) return logerr('gethtml('+id+') no such id',errok);
	return o.innerHTML;
}

// post form, optionally to url
function gopost(url) {
	if(url) document.form1.action=(url);
	document.form1.submit();
}

// return unix timestamp in seconds with 3 decimal places, or arg=true for integer, or arg='ms' for milliseconds
function now(arg) {
	var ms=Date.now();
	if(arg=='ms') return ms;
	var s=ms/1000;
	return (arg)? Math.floor(s) : s;
}

// for logging
function readtimestamp(t) {
	if(!parseInt(t)) return 'zero';
	var d=new Date(t*1000);
	return d.toString();
}

function loadres(url,url2) {
	if(url.indexOf('.css')>0) {
		var node = document.createElement('link');
		node.rel = 'stylesheet';
		node.href = url;
	}
	else if(url.indexOf('.js')>0) {
		var node = document.createElement('script');
		node.src = url;
	}
	else return logerr('loadres invalid '+url);
	logit('load '+url);
	if(url2)  // load 2nd js after 1st js fully loaded
		node.addEventListener('load', function() {loadres(url2);}, false);
	document.head.appendChild(node);
}


// STYLES

// set css classname
function setstyle(id,list,errok) {  // list=list of classes, or "+class -class" to add and/or remove classes
	var o=el(id);
	if(!o) return logerr('setstyle('+id+','+list+') no such id',errok);
	var a=list.charAt(0);
	if(a!='+' && a!='-')
		return o.setAttribute('class',list);  // .className does not work for svg
	list=list.split(' ');
	for(var i=0; i<list.length; i++) {
		var a=list[i].charAt(0);
		var c=list[i].substr(1);
		if(a=='+') o.classList.add(c);
		else if(a=='-') o.classList.remove(c);
		else logerr('setstyle('+id+','+list.join(' ')+') syntax');
	}
}

// show/hide element; uses transition if class=accordion/accordionclosed
// x= true/1/'show', false/0/'hide', 'spacer', or null/'toggle' (accordion only)
// scroll=true to scroll window to show element (accordion only)
// sets className; no effect if inline display rule; unpredictable if multiple rules with display
// returns true if visible, false if hidden (accordion only)
function setviz(id,x,errok,scroll) {
	var o=(typeof(id)=='string')? el(id) : id;
	if(!o) return logerr('setviz('+id+','+x+') no such id',errok);
	var styles=String(o.getAttribute('class'));  // .className cannot be set for svg
	if(styles.indexOf('floatbox')>=0 && x && x!='hide' && x!='spacer') {
		o.style.top=((mini?75:110)+window.pageYOffset)+'px';
		if(!mini) {
			var r=document.documentElement.clientWidth-1024;  // see also 2.js resize()
			if(r<20 || touch) r=0;
			o.style.right=(r+20-window.pageXOffset)+'px';
		}
		else
			o.style.left=window.pageXOffset+'px';
	}
	if(styles.indexOf('accordion')>=0)  // svg className is an object that causes errors here; don't use setviz on svg
		accordion(o,x,scroll);
	else {
		var i, c=' '+styles+' ';
		if((i=c.indexOf(' hide '))>=0)
			c=c.substring(0,i)+c.substring(i+5,9999);
		if((i=c.indexOf(' spacer '))>=0)
			c=c.substring(0,i)+c.substring(i+7,9999);
		if(x=='hide' || !x) c=' hide'+c;
		else if(x=='spacer') c=' spacer'+c;
		o.setAttribute('class',c.substr(1,c.length-2));
		if(scroll) scrolltoview(o);
	}
}

acctimer=[];
function accordion(o,x,scroll) {
	if(acctimer[o.id]) {  // clicked rapidly before previous animation complete
		clearTimeout(acctimer[o.id][1]);
		if(acctimer[o.id][0]) {  // finish openning now before closing
			o.className=String(o.className).replace(/accordion[a-z]+/,'accordion');
			o.style.height='auto';
		}
		acctimer[o.id]=null;
	}
	if(x==='toggle' || x===null || x===undefined) x=(o.clientHeight==0);
	var c=String(o.className).replace(/accordion[^ ]* ?/,'');
	// page loading (no animation)
	if(isbusy) {
		o.className=(x)? 'accordion '+c : 'accordionclosed '+c;
		o.style.display=(x)? 'block':'none';
	}
	// open
	else if(x) {
		var ht0=o.clientHeight;
		o.style.display='block';
		o.className='accordion '+c;  // remove transition
		o.style.height='auto';
		if(ht0>0) return true;  // already open, but do above to avoid issues with rapid switching
		var ht1=o.clientHeight;  // measure natural height
		o.style.height='0px';
		o.className='accordiontrans '+c;
		setTimeout(function() {o.style.height=ht1+'px';},15);  // 15ms delay helps Firefox
		acctimer[o.id]=[1];
		acctimer[o.id][1]=setTimeout(function() {  // when done change to auto height
			acctimer[o.id]=null;
			o.className='accordion '+c;
			o.style.height='auto';
			if(scroll) scrolltoview(o);
		},300);
		return true;
	}
	// close
	else {
		if(o.clientHeight==0) return;  // ignore if already closed
		var ht0=o.style.height;
		if(ht0=='auto' || !ht0) {  // change to fixed height
			o.className='accordion '+c;  // remove transition
			o.style.height=o.clientHeight+'px';
			setTimeout(function() {o.className='accordiontrans '+c;},0);
		}
		setTimeout(function() {o.style.height='0px';},15);  // 15ms delay helps Firefox
		acctimer[o.id]=[0];
		acctimer[o.id][1]=setTimeout(function() {
			acctimer[o.id]=null;
			o.style.display='none';
		},500);
		return false;
	}
}

// accordion div (id=caseid)
// 1. accordioncase(caseid); 2. show/hide contents; 3. accordioncase();
// or close=true to close case
function accordioncase(caseid,close) {
	if(caseid) {  // prep
		caseo=el(caseid);
		ht0=caseo.clientHeight;
		caseo.className='';
		caseo.style.height='auto';
		if(close) {  // close while contents still inside
			if(!isbusy) {
				caseo.style.height=ht0+'px';
				caseo.className='accordiontrans';
				setTimeout(function() {caseo.style.height='0px';},15);  // 15ms delay helps Firefox
				setTimeout(function() {caseo.className='accordionclosed';},300);  // after transition
			}
			else {  // no transition while page loading
				caseo.style.height='0px';
				caseo.className='accordionclosed';
			}
		}
	}
	else {  // resize (but not close)
		ht1=caseo.clientHeight;
		if(!isbusy) {
			caseo.style.height=ht0+'px';
			caseo.className='accordiontrans';
			setTimeout(function() {caseo.style.height=ht1+'px';},15);  // 15ms delay helps Firefox
			setTimeout(function() {caseo.className=''; caseo.style.height='auto';},300);  // when done change to auto height
		}
		else {  // no transition while page loading
			caseo.style.height=ht1+'px';
			caseo.className=''; caseo.style.height='auto';
		}
	}
}

// set visibility of css rule by name (without the dot)
// x= true/'show', false/'hide', 'spacer'
function setvizrule(rule,x) {
	setstylerule('.'+rule, 'display', (x=='hide' || !x)? 'none':'');
	setstylerule('.'+rule, 'visibility', (x=='spacer')? 'hidden':'visible');
}

// redefine css rule
// rule = classname (with dot) like '.abc'
// att = display, visibility, fontSize, etc.
// x = value
// which = 2 for 2nd rule, 3 for 3rd rule, etc.; null/1 if only 1 rule
function setstylerule(rule,att,x,which,errok) {
	if(which>=2) var key=rule+'#'+which;
	else {
		var key=rule;
		if(!which) which=1;
	}
	if(typeof cssrules=='undefined') cssrules=[];
	if(!cssrules[key]) {
		var s,r,o;
		for(s=0; s<document.styleSheets.length; s++) {
			try {o=document.styleSheets[s].cssRules || document.styleSheets[s].rules;}
			catch(e) {continue;}
			if(!o) continue;  // external font
			for(r=0; r<o.length; r++) {
				if(o[r].selectorText!=rule) continue;  // note: this doesn't match if one of many selectors, e.g. "mystyle" matches ".mystyle" but not ".mystyle, .other"
				if(which>1) which--;
				else {
					cssrules[key]=o[r];
					break;
				}
			}
			if(cssrules[key]) break;
		}
		if(!cssrules[key]) {
			if(!errok) logerr('no css rule '+rule);
			return;
		}
	}
	var o=cssrules[key];
	o.style[att]=x;
}

// return true if visible
function isviz(id,errok) {
	var o=el(id);
	if(!o) return logerr('isviz('+id+') no such id',errok);
	return (o.getBoundingClientRect().width!=0 && o.getBoundingClientRect().height!=0);
}



// KEYBOARD

function gettarget(o) {  // find ancestor textbox: target may be within child, even <br>)
	if(o.id && o.id.substr(0,5)=='text_' || o.type=='password' || o.type=='textarea' && !o.hasAttribute('data-mq')) return o;  // mq=mathquill
	while(true) {
		o=o.parentNode;
		if(!o || o.tagName=='FORM' || o.tagName=='BODY') return false;  // fail-safe
		if(o.id && o.id.substr(0,5)=='text_') return o;
	}
}

document.addEventListener('input',function(e) {  // like keyup, but includes autocomplete, excludes arrows/shift/ctrl/cmd/opt
	lastact=Date.now();
	if(self.oninput) oninput();
	if(e.target.tagName=='BODY') return;
	var o=gettarget(e.target);
	if(o && o.hasAttribute('doinput')) eval(o.getAttribute('doinput'));
},true);

document.addEventListener('keyup',function(e) {  // used only for shift, cmd, etc
	if(!self.onkeyup) return;
	var c=e.key || self.keyc0;  //? iPad may lose keycode onkeyup, esp w hardware keyboard, so remember keydown key
	if(c=='Unidentified' && e.keyCode==229) c='x';  // old Android Chrome gives 229 for all visible characters
	onkeyup(c);
},true);

document.addEventListener('keydown',function(e) {
	var c=e.key;
	if(!c || c=='Unidentified' && e.keyCode==229) c='x';  // fail-safe if undefined; old Android Chrome gives 229 for all visible characters
	var a=(c.length==1)? c.charCodeAt(0):0;  // ascii, 0 if not a character
	//logit(e.keyCode+' ['+e.code+'] ['+c+'] '+(a||''));///
	if(self.onkeydown) {
		var it=onkeydown(c,e);  // every key; return false to stop
		if(it===false) {
			e.preventDefault();
			return;
		}
	}
	keyc0=c;
	if(c=='Shift' || c=='Alt' || c=='Control' || c=='Meta') return;
	if(tipopen) hidetip();
	// Cmd/Ctrl
	if(e.ctrlKey || e.metaKey) {
		if(c=='b') richformat('bold');
		else if(c=='i') richformat('italic');
		else if(c=='u') richformat('underline');
		else if(c==' ' && logwin) showjuplog(e.shiftKey || e.altKey);
		else if(c=='Enter' && self.cmdreturn) cmdreturn();  // staffedit
		//else if(self.cmdarrow && !a && c.substr(0,5)=='Arrow') cmdarrow(c);  // unused
		else if((platform=='Mac')? e.metaKey : e.ctrlKey) return true;  // allow Mac ⌘ or Win Ctrl; block Mac Ctrl
		e.preventDefault();
		return;
	}
	// Escape
	if(c=='Escape') {
		if(!el('text_find')) return true;
		closemenus('esc');
		focus('find');
	}
	// Type Outside Textbox
	if(!textfocus && e.target.type!='password' && e.target.type!='textarea') {
		// Menu: type to select menu item
		if(menuopen) {
			var menua=(menuopen.substr(0,5)=='menua');
			var listo=(menua)? el(menuopen+'_list').children[0] : el('menulist_'+menuopen);
			if(c=='Enter') {  // return to select
				e.preventDefault();
				if(menukeylit===null) return closemenus('return in menu');
				clickvalo=listo.children[menukeylit];
				clickvalo.className='menurow';
				clickval=clickvalo.getAttribute('val');
				if(menua) eval(listo.getAttribute('click'));
				else clickmenu(menuopen);
			}
			else if(a>=32 || c=='Backspace') {
				e.preventDefault();
				var ms=now('ms');
				if(ms-menukeylast>=1000) menukeystring='';  // start over after 1 sec
				menukeylast=ms;
				if(a) menukeystring+=c.toUpperCase();
				else if(menukeystring)  // backspace
					menukeystring=menukeystring.substr(0,menukeystring.length-1);
				var l=menukeystring.length, z=menukeyindex.length;
				if(!l) return;
				for(var i=0; i<z; i++) {
					if(!menukeyindex[i]) continue;
					if(!menukeyindex[i] || menukeyindex[i].substr(0,l)!=menukeystring) continue;
					if(i===menukeylit) return;
					if(menukeylit!==null)
						listo.children[menukeylit].className='menurow';  // unlite other
					var o=listo.children[i];
					o.className='menurow hilite';  // hilite
					scrolltoview(o);
					menukeylit=i;
					break;
				}
			}
			else return true;
		}
		// Find Student: start typing outside any textbox
		else if(!e.target.isContentEditable) {
			if(!el('text_find')) return true;
			if(!(a>=97 && a<=122 || a>=65 && a<=90 || a>=48 && a<=57)) return true;  // a-z A-Z 0-9
			if(c=='Enter') return findstud(val('admin',0,'errok'));
			settext('find','');
			setstyle('ph_find','hide');
			focus('find');
			return true;
		}
		// fix focus
		else {
			logit('fix text focus');  // this happens on grid when arrow key can't move anymore
			focustext(e.target);
			return true;
		}
	}  // type outside textbox
	// Target
	var o=gettarget(e.target);
	if(!o) return;  // fail-safe
	// Return
	if(c=='Enter') {
		if(o.hasAttribute('doreturn') && !(e.shiftKey && o.getAttribute('br')==1)) {  // do return (unless shift-return in multiline)
			blur(o);
			e.preventDefault();
			shiftkey=e.shiftKey;
			var ok=eval(o.getAttribute('doreturn'));
			if(ok===false) hoptext(e, o, e.shiftKey?'up':'down', false, true);  // onreturn() return false to default hop
		}
		else if(o.type!='textarea' && !(e.shiftKey && o.getAttribute('br')==2) && o.getAttribute('br')!=3)  // hop (unless shift-return in shiftreturn:1)
			hoptext(e, o, e.shiftKey?'up':'down', false, true);  // hop, or type return if allowed
		return;
	}
	// Tab
	else if(c=='Tab') {
		if(o.hasAttribute('tabdef')) return true;
		else if(o.hasAttribute('tab')) {
			typestring("\t");
			e.preventDefault();
			if(!o.hasAttribute('dokeydown')) return;  // trigger keydown
		}
		else return hoptext(e, o, e.shiftKey?'left':'right', true, false);  // hop
	}
	// Arrow Keys
	else if(c=='ArrowDown') return hoptext(e, o,'down');
	else if(c=='ArrowUp') return hoptext(e, o,'up');
	else if(c=='ArrowRight') return hoptext(e, o,'right');
	else if(c=='ArrowLeft') return hoptext(e, o,'left');
	// Limit
	if(a && o.hasAttribute('limit') && !window.getSelection().toString()) {  // can't type visible chars if over limit
		var it=o.innerHTML;
		it=it.replace(/&[a-z]+?;/gi,'*');
		it=it.replace(/<.+?>/g,'');
		if(it.length>=o.getAttribute('limit')) return e.preventDefault();
	}
	// Backslash
	if(c=='\\' && !e.shiftKey && !e.altKey && o.isContentEditable) {
		typestring('✓');
		e.preventDefault();
		return;
	}
	// Placeholder
	if(o.getAttribute('ph')-0)
		showplaceholder(o,o.id.substr(5),0);
	// Required
	if(o.hasAttribute('ph')) o.parentNode.classList.remove('required');
	else o.classList.remove('required');
	/*/// unused // On Type
	if(o.hasAttribute('dokeydown') && (a || c=='Backspace' || c=='Delete')) {  // changing text, attribute of textbox
		shiftkey=e.shiftKey;  // global
		eval(o.getAttribute('dokeydown'));
	} */
},true);

function showplaceholder(o,id,x) {
	document.getElementById('ph_'+id).className=(x)?'placeholder':'hide';
	o.setAttribute('ph',x);
}

function hoptext(e,o,dir,tab,ret) {
	if(o.getAttribute('br')==1 || o.type=='textarea') return;  // multi-line text: keep default return/arrow behavior
	if(o.hasAttribute('doarrow')) {
		blurit(o);  // force onchange if needed (o.blur() does not work in some cases)
		arrow=dir;
		eval(o.getAttribute('doarrow'));
		if(arrow===false) return;  // set arrow=false to allow type
		e.preventDefault();
		return;
	}
	var table=o.getAttribute('table');
	if(!table && (dir=='left' || dir=='right')) {
		if(!tab) return;  // left/right arrow keys move cursor if not in table
		else if(dir=='right') dir='down';
		else if(dir=='left') dir='up';
	}
	var col=o.getAttribute('col');
	if(col) col-=0;
	e.preventDefault();
	var rect=o.getBoundingClientRect();
	var x=rect.left, y=rect.top;
	var up=(dir=='up'), down=(dir=='down'), left=(dir=='left'), right=(dir=='right');
	var p=false, after=false, rect, x1=(right)?99999999:-99999999, y1=(down)?99999999:-99999999, i0=false, col1;
	var all = document.querySelectorAll('.textbox,.textboxp2,.textmenu');
	var z=all.length;
	for(var i=0; i<z; i++) {
		if(!all[i].isContentEditable || !tab && (all[i].getAttribute('br')==1 || all[i].getAttribute('br')==3 && ret))
			continue;  // can't select multi-line boxes with arrows or return (only tab), skip disabled
		rect=all[i].getBoundingClientRect();
		if(rect.width==0) continue;  // hidden
		// no col/table, or tab not in table
		if(!table && (!col || tab)) {
			if(down) {  // next in code
				if(all[i]==o) after=true;
				else if(after) {
					p=all[i];
					break;
				}
			}
			else {  // prev in code
				if(all[i]==o) break;
				p=all[i];
			}
		}
		// col
		else if(col) {
			col1=all[i].getAttribute('col');
			if(col1) col1-=0;
			if(all[i]==o) {  // this textbox
				after=true;
				continue;
			}
			if(down) {
				if(col1==col) {
					if(!after) continue;
					p=all[i];
					break;
				}
				if((col1>col || !col1 && after) && i0===false) i0=i;  // else first box after
			}
			else if(up) {
				if(col1==col) {
					if(!after) p=all[i];
				}
				if(col1<col || !col1) i0=i;  // else last box before
			}
		}
		// table
		else {
			if(all[i].getAttribute('table')!=table) {  // textbox before or after table
				if((left || up) && !after || (right || down) && after && i0===false) i0=i;
				continue;
			}
			if(all[i]==o) {  // this textbox
				after=true;
				continue;
			}
			// same table
			if(down) {
				if(rect.left!=x || rect.top<y || rect.top>y1) continue;
				y1=rect.top;
			}
			else if(up) {
				if(rect.left!=x || rect.top>y || rect.top<y1) continue;
				y1=rect.top;
			}
			else if(right) {
				if(rect.top!=y || rect.left<x || rect.left>x1) continue;
				x1=rect.left;
			}
			else {
				if(rect.top!=y || rect.left>x || rect.left<x1) continue;
				x1=rect.left;
			}
			p=all[i];
		}
	}
	// select
	if(!p) {  // not in same col/table
		if(i0===false || table && (left || right)) {
			if(o.hasAttribute('blur')) blurit(o);  // if attribute blur and no where else to hop, just blur (instead of doing nothing)
			return;
		}
		p=all[i0];
	}
	focus(p,0,'','fromkey');
}


// MOUSE & TOUCH

clicko=lastclicko=dragging=dragf=scrolled=winscroll0=touching=touchingtimer=touchscreen=false;
clicktime=lastclicktime=0;
isbusy=0;  // used by 2.js

// chrome & firefox fire touch events if screen used; edge fires only mouse events
document.addEventListener('mousedown',pointerdown,true);
document.addEventListener('mouseup',pointerup,true);
document.addEventListener('mousemove',pointermove,true);
document.addEventListener('touchstart',pointerdown,true);
document.addEventListener('touchend',pointerup,true);
document.addEventListener('touchmove',pointermove,true);

function pointerdown(e) {
	lastact=Date.now();
	touchscreen=(e.type=='touchstart');
	if(e.type=='mousedown' && touching) return;
	clicko=clickvalo=clickval=scrolled=closedmenu=dblclick=false;
	if(e.button==2 || !e.target.tagName) return true;  // default right-click; Win Chrome 59 fires mouseevents for scrollbar (tagName=undefined)
	if(isbusy) return e.preventDefault();
	if(e.type=='touchstart') flagtouching();
	clicktime=lastact;  // ms
	// find element with click attribute, and element with val attribute if any
	etarget=e.target;
	var o=etarget;
	if(!o) return;  // fail-safe
	if(o.tagName!='HTML' && o.tagName!='BODY' && o.tagName!='FORM') {
		//var l='';///
		while(true) {  // climb dom tree
			//if(o.id) l='#'+o.id+l; l=' > '+o.localName+l;///
			if(!clickvalo && o.hasAttribute('val')) clickvalo=o;  // element with val attribute, or its first ancestor with a val
			if(o.hasAttribute('click') || o.isContentEditable) {  // found clickable element
				clicko=o;
				break;
			}
			if(o.hasAttribute('stop')) break;  // don't pass thru to parent
			o=o.parentNode;  // try next ancenstor
			if(!o || o.tagName=='FORM' || o.tagName=='BODY' || o.tagName=='HTML') break;  // nothing clickable
		}
	}
	else if(e.type=='mousedown') e.preventDefault();  // prevent firefox from selecting all textboxes
	// ⌘/Alt-click to show tip (if any)
	if(((platform=='Mac')? e.metaKey : e.altKey) && !o.hasAttribute('noclicktip')) {
		clicko=clickvalo=false;
		showtip();
		return;
	}
	// Shift-click to make screen text copyable
	else if(e.shiftKey && !clicko) {  // not on something clickable
		document.body.className='selectable';
		return;
	}
	else if(tipopen) hidetip();
	// double-click
	if(clicktime-lastclicktime<=500) {
		if(e.type=='touchstart') e.preventDefault();  // don't zoom (but safari always zooms; doesn't seem preventable at edges of screen?)
		if(clicko && clicko.hasAttribute('dblclick') && lastclicko==clicko) {
			if(e.type=='touchstart') var xd=Math.abs(clickx-e.touches[0].pageX), yd=Math.abs(clicky-e.touches[0].pageY);
			else var xd=Math.abs(clickx-e.pageX), yd=Math.abs(clicky-e.pageY);
			if(Math.sqrt(xd*xd+yd*yd)<=10) dblclick=true;
		}
	}
	lastclicktime=clicktime;
	//logit('mousedown '+(l? l.substr(3): 'html'));///
	if(e.type=='touchstart' && !o.isContentEditable && textfocus && !o.hasAttribute('stop') && !o.hasAttribute('nodef'))  // ios doesn't normally blur text
		blur(textfocus);
	// click
	if(!clicko) return;  // nothing clickable, so let default handle drag
	if(clickvalo) {
		clickval=clickvalo.getAttribute('val');
		if(String(clickval)===String(clickval-0)) clickval-=0;  // number instead of string
	}
	shiftclick=e.shiftKey;
	optclick=(platform=='Mac')? e.altKey : e.ctrlKey;
	// double-click
	if(dblclick) {
		e.preventDefault();  // prevent text selection
		eval(clicko.getAttribute('dblclick'));
		lastclicktime=0;
		return;  // keep clickx/y from 1st click
	}
	lastclicko=clicko;
	// clickable
	if(e.type=='touchstart') clickx=e.touches[0].pageX, clicky=e.touches[0].pageY;
	else clickx=e.pageX, clicky=e.pageY;
	dragx=dragy=0;
	winscroll0=window.pageYOffset+','+window.pageXOffset;
	dragging=dragf=false;
	if(clicko.hasAttribute('dragmove') && (!clicko.hasAttribute('dragok') || eval(clicko.getAttribute('dragok')))) {
		e.preventDefault();  ///5/2018 webkit bug?: preventDefault() fails for touchstart event unless explicit ontouchstart="event.preventDefault()"
		eval('dragf=function() {'+clicko.getAttribute('dragmove')+'}');
		if(clicko.hasAttribute('dragonly')) {  // don't wait for mouse movement
			dragging=true;
			eval(clicko.getAttribute('dragstart'));
		}
		closemenus('start drag');
	}
	else if(clicko.hasAttribute('nodef')) e.preventDefault();
	// clickstart
	if(clicko.hasAttribute('clickstart'))
		eval(clicko.getAttribute('clickstart'));
	// shift-click textbox to force dochange
	if(shiftclick && clicko.isContentEditable && clicko.getAttribute('dochange')) {
		logit('force onchange id='+clicko.id);
		eval(clicko.getAttribute('dochange'));
	}
}

dragmin=(touchos)? 15:8;  // iOS has bug if >15; 10 is considered dragging
function pointermove(e) {  // touchmove doesn't fire unless peventDefault
	if(e.type=='mousemove' && touching) return;
	if(e.type=='touchmove') var x=e.touches[0].pageX, y=e.touches[0].pageY;
	else var x=e.pageX, y=e.pageY;
	// drag
	if(clicko) {
		dragx=x-clickx;
		dragy=y-clicky;
		if(!dragging && (Math.abs(dragx)>=dragmin || Math.abs(dragy)>=dragmin)) {  // start drag
			dragging=true;
			if(dragf)
				eval(clicko.getAttribute('dragstart'));
		}
		if(dragging && dragf)
			dragf.call();
	}
	// tip
	if(tipopen && (Math.abs(x-tipx)>=10 || Math.abs(y-tipy)>=10)) {  // not hidetip()
		tipbox.style.display='none';
		tipopen=false;
	}
	if(tiptimer) {
		clearTimeout(tiptimer);
		tiptimer=false;
	}
	if(tip && !dragging && self.showtip) {
		mousex=e.clientX, mousey=e.clientY;  // for showtip(), relative to window
		if(!self.notips) tiptimer=setTimeout(function() {showtip()},1500);  // wait 1.5 sec
	}
}
mousex=-100, mousey=-100;  // in case click disabled item without moving mouse
tipx=-100, tipy=-100;

function pointerup(e) {
	if(e.type=='mouseup' && touching) return;
	if(e.type=='touchend') flagtouching();
	if(winscroll0!=window.pageYOffset+','+window.pageXOffset) scrolled=true;  // ios standalone doesn't fire onscroll, so check if page moved since touchstart
	if(!dragging && (now('ms')-clicktime>500)) scrolled=true;  // ignore if hold; might be touch scrolling back to start point
	if(!scrolled || dragging || clicko && clicko.hasAttribute('clickstart')) {  // ignore click if scrolled (touch)
		if(!scrolled && !dragging && !(clicko && clicko.hasAttribute('stop')))  // don't close menu if 'stop' attribute
			closemenus('pointer up '+clicko.id);
		if(clicko && !dblclick) {
			if((!dragging || clicko.hasAttribute('clickstart')) && clicko.hasAttribute('click')) {  // click fires if pure click or always after clickstart
				eval(clicko.getAttribute('click'));  // click (do nothing if none)
				if(clicko.hasAttribute('stop')) e.preventDefault();  // add 'stop' to prevent touch from going through menu to textbox beneath
			}
			if(dragging && dragf)
				eval(clicko.getAttribute('dragend'));  // end drag
		}
	}
	clicko=dragging=dragf=false;
	tip='';
}

if(!touchos) {
	document.addEventListener('mouseover',function(e) {
		tip='';
		var o=e.target;
		while(o && o.tagName && o.tagName!='FORM' && o.tagName!='BODY' && o.tagName!='HTML') {  // climb dom tree; Win Chrome 59 fires mouseevents for scrollbar (tagName=undef)
			if(o.hasAttribute('tip')) {
				tip=safetags(o.getAttribute('tip'));
				break;
			}
			o=o.parentNode;  // try next ancestor
		}
	},true);  // event hits parent then child, regardless of bubbling; ignores stopPropagation; mouseenter hits intermediate ancestors
}

function flagtouching() {
	touching=true;
	if(touchingtimer) clearTimeout(touchingtimer);
	touchingtimer=setTimeout(function() {
		touching=false;
		touchingtimer=false;
	},400);
}

tipopen=false;
tiptimer=false;
tip='';

window.addEventListener('scroll',function(e) {
	if(e.target.id!='clientlog') scrolled=true;  // sense page or navlist
},true);

function closemenus(w) {
	if(self.navopen) {
		closedmenu=navopen;
		popnav(navopen);
	}
	if(menuopen) {
		closedmenu=menuopen;
		popmenu(menuopen);
	}
	if(self.studpickeropen && (!clicko || !clicko.hasAttribute('clickfind')))
		popstudpicker();
	if(self.findopen && (!clicko || !clicko.hasAttribute('clickfind')))
		showfind('');
	if(self.calopen && (!clicko || clicko.id!='text_'+calopen))
		hidecal();
	if(self.closemenus1)
		closemenus1();
}



// BUTTON

// draw button
function btn(label,script,att,disabled,draw) {
	if(!att) att={};
	else if(typeof(att)!='object') logerr("btn("+label+") att should be object");
	var gap=att.gap;
	if(gap==null) gap=4;
	var style=(disabled || att.disabled)? 'dimbtn':'btn';
	var html='<div';
	if(att.id) html+=' id="'+att.id+'"';
	html+=' class='+style+' click="clickbtn()" script="'+script+'"';
	if(att.tip) html+=' tip="'+att.tip+'"';
	if(gap || att.width || att.style) {
		html+=' style="';
		if(gap>0) html+='margin-left:'+gap+'px;';
		else if(gap<0) html+='margin-right:'+(-gap)+'px;';
		if(att.width) html+='min-width:'+att.width+'px;';
		if(att.style) html+=att.style;
		html+='"';
	}
	if(att.html) html+=' '+att.html;
	html+='>'+label+'</div>';
	// output
	if(draw) document.write(html);
	else return html;
}

function clickbtn() {
	if(clicko.className.substr(0,3)!='dim')
		eval(clicko.getAttribute('script'));
	else if(clicko.getAttribute('tip'))
		showtip();
}

function setbtndim(id,disabled,errok) {
	var o=el(id);
	if(!o) return logerr('setbtndim('+id+','+disabled+') no such element',errok);
	if(disabled) {
		o.classList.remove('btn');
		o.classList.add('dimbtn');
	}
	else {
		o.classList.add('btn');
		o.classList.remove('dimbtn');
	}
}



// TEXT BOX
textfocus=false;
texthtml0='';
try {document.execCommand('styleWithCSS',false,false)} catch(e) {}

// draw textbox
function textbox(id,content,width,att,disabled,draw) {
	if(!att) att={};
	else if(typeof(att)!='object') logerr("textbox("+id+") att should be object");
	var css1=css2=att2='';
	var newpass=(att.type=='newpassword');
	if(newpass) att.type='password';
	if(att.type=='password' && !att.placeholder) att.placeholder=' ';
	var ph=Boolean(att.placeholder);
	// attributes
	if(att.type=='date') {
		if(!width) width=(att.min)? 45:60;  // min removes year
		if(!att.limit) att.limit=10;
	}
	if(disabled || att.disabled) {
		disabled=true;
		if(ph) css1="background-color:#f0f0f0;";
		else css2+="background-color:#f0f0f0;";
		css2+="cursor:default;";
		att2+=(att.tip)? ' click="showtip()"' : ' click=""';
	}
	else {
		if(att.readonly) css2+="cursor:default;";
		else if(att.type!='password') att2+=' contenteditable';
		if(att.type) {  // password,number,date,time,email,emaillist,url
			att2+=' type='+att.type;
			if(att.numberformat) att2+=' numberformat="'+att.numberformat+'"';
			if('decimals' in att) att2+=' decimals='+att.decimals;
			if('min' in att) att2+=' min="'+att.min+'"';
			if('max' in att) att2+=' max="'+att.max+'"';
			if('caldef' in att) att2+=' caldef="'+att.caldef+'"';
			if(att.roundmin) att2+=' roundmin='+att.roundmin;
			if(att.loose)    att2+=' loose';
		}
		else {  // text
			if(att.format) att2+=' format='+att.format;
			if(att.tab) att2+=' tab', css2+='white-space:pre-wrap;';
			if(att.keepspace) {
				att2+=' keepspace='+att.keepspace;
				if(att.keepspace-0==3 && !att.tab) css2+='white-space:pre-wrap;';
			}
			if(att.tabdef) att2+=' tabdef';
			if(att.caps) att2+=' caps='+att.caps;
			if(att.formatbtns) att2+=' formatbtns';
			if(att.bi) att2+=' bi';
		}
		if(att.type || 'spellcheck' in att) {
			att2+=' spellcheck=false autocapitalize=none autocorrect=off';
			if(newpass) att2+=' autocomplete=new-password';
			else if(att.type=='password') att2+=' autocomplete=current-password';
			else if(att.placeholder && att.placeholder.indexOf('Username')!=-1) att2+=' autocomplete=username';
			else att2+=' autocomplete=off';
		}
		if(att.col) att2+=' col='+att.col;
		if(att.table) att2+=' table='+att.table;
		if(att.limit) att2+=' limit='+att.limit;
		if(att.onchange) att2+=' dochange="'+att.onchange+'"';
		if(att.onreturn && att.onreturn!='hop') att2+=' doreturn="'+att.onreturn+'"';
		if(att.onkeydown) att2+=' dokeydown="'+att.onkeydown+'"';
		if(att.oninput) att2+=' doinput="'+att.oninput+'"';
		if(att.onarrow) att2+=' doarrow="'+att.onarrow+'"';
		if(att.onfocus) att2+=' dofocus="'+att.onfocus+'"';
		if(att.onblur) att2+=' doblur="'+att.onblur+'"';
		if(att.blur) att2+=' blur';
		if(att.onclick) att2+=' click="'+att.onclick+'"';
		if(att.stop) att2+=' stop';
		if(att.default!=null) att2+=' default="'+att.default+'"';
		if(att.focustop) att2+=' focustop';
	}
	if(att.html) att2+=' '+att.html;
	if(att.tip) att2+=' tip="'+att.tip+'"';
	if(att.bold) css2+="font-weight:bold;";
	if(att.block) css2+="display:block;";
	if(att.right) css2+="text-align:right;";
	// width
	var d=(ph)?2:0;  // with placeholder subtract 2 from width for border
	var w1,w2;
	if(!width) {
		if(ph) css1+="width:100%;";
		else css2+="width:100%;";
	}
	else {
		if(typeof(width)=='number')
			w1=w2=width;
		else {
			var it=width.split('-');
			w1=it[0], w2=it[1];
			if(w1[0]=='d') {
				w1=Math.round(w1.substr(1)*6.68+12);
				if(w2) {
					if(w2[0]=='d') w2=w2.substr(1);
					w2=Math.round(w2*6.68+12);
				}
			}
		}
		if(w2==w1) css2+="width:"+(w1-d)+"px;";
		else if(!w2) css2+="min-width:"+(w1-d)+"px;";
		else css2+="min-width:"+(w1-d)+"px; max-width:"+(w2-d)+"px;";
	}
	// rows
	var lineht=16;
	var d=(ph)?0:2;  // without placeholder add 2 to height for border
	var r1,r2;
	if(!att.rows) r1=r2=1;
	else if(typeof(att.rows)=='number') r1=r2=att.rows;
	else {
		var it=att.rows.split('-');
		r1=it[0], r2=it[1];
	}
	if(r2==r1) css2+="height:"+(r1*lineht+d)+"px;";
	else if(!r2) css2+="min-height:"+(r1*lineht+d)+"px;";
	else css2+="min-height:"+(r1*lineht+d)+"px;max-height:"+(r2*lineht+d)+"px;";
	if(r2>1 || !r2) {  // multi rows: br=0 single row, br=1 multi row, br=2 multi row shift for return, br=3 single expandable row
		if(att.onreturn=='hop') att2+=' br=2';  // press shift for return, otherwise hop
		else if(att.onreturn!==false) att2+=(r1==1)? ' br=3':' br=1';
		css2+="overflow-y:auto;";
		if(!att.tab && (att.keepspace-0 || 0)<3) css2+="white-space:normal;";
		else if(disabled) css2+='white-space:pre-wrap;';
	}
	// post
	var html='';
	content=String(content);
	if(att.type!='password' && (!('post' in att) || att.post)) html+=  // post defaults true
'<input type=hidden name="'+id+'" value="'+content.replace(/"/g,'&#34;')+'">\n';
	// calendar
	if(att.type=='date') html+=
'<span id=cal_'+id+'></span>';
	// w placeholder
	if(ph) {
		if(css1) css1=" style='"+css1+"'";
		att2+=' ph='+(content?0:1);
		html+=
'<div class=textboxp1'+css1+'>\n'+
'	<div id=ph_'+id+' class='+(content?'hide':'placeholder')+'>'+att.placeholder+'</div>\n';
		html+=(att.type=='password')?
'	<input type=password class=password id=text_'+id+' name=text_'+id+' value="'+content+'" '+att2+' style="'+css2+'" maxlength=32 tabdef>\n':
'	<div id=text_'+id+' class=textboxp2'+att2+' style="'+css2+'">'+
		((disabled && content=='')?'&nbsp;':content)+  /// safari bug causes weird spacing if empty
	'</div>\n';
		html+=
'</div>';
	}
	// wo placeholder
	else {
		var c=(att.shape)? '"textbox '+att.shape+'box"' : 'textbox';
		html+=
'<div id=text_'+id+' class='+c+''+att2+' style="'+css2+'">'+
	((disabled && content=='')?'&nbsp;':content)+  /// safari bug causes weird spacing if empty
'</div>';
	}
	// formatbtns
	if(att.formatbtns && !touchos) {
		html+=
'<div id=formatbtns_'+id+' class=hide style="position:absolute; margin:-1px 0px 0px 7px;">\n'+
'<div class=btn nodef click="richformat(\'bold\')" style="width:30px; font-size:16px; vertical-align:-1px; border-top-left-radius:0px; border-top-right-radius:0px; border-bottom-right-radius:0px; padding-left:13px; padding-right:7px;"><b>B</b></div>'+
'<div class=btn nodef click="richformat(\'italic\')" style="width:30px; font-size:16px; vertical-align:-1px; border-radius:0px;"><i>I</i></div>'+
'<div class=btn nodef click="richformat(\'underline\')" style="width:30px; font-size:16px; vertical-align:-1px; border-top-right-radius:0px; border-top-left-radius:0px; border-bottom-left-radius:0px; padding-right:13px; padding-left:7px;"><u>U</u></div>\n'+
'</div>';
	}
	// output
	inittextbox(id);
	if(draw) document.write(html);
	else return html;
}

function inittextbox(id) {
	if(!self.inittextboxes) inittextboxes=[];
	inittextboxes.push(id);
	if(!self.inittexttimer)
		inittexttimer=setTimeout(inittextboxfunc);
}

function inittextboxfunc(e,retry) {
	inittexttimer=false;
	var id,o;
	while(id=inittextboxes.shift()) {
		o=el('text_'+id);
		if(o)
			domwatch.observe(o, {attributes:true, childList:true, subtree:true});
		else if(retry)
			logjserror("text_"+id+" doesn't exist for domwatch");
		else {
			inittextboxes.unshift(id);
			inittexttimer=setTimeout(function() {inittextboxfunc(0,true);},500);  // try again with delay, esp if not drawn immediately
			return;
		}
	}
}

// set text of textbox; return true if exists, else null
function settext(id,x,errok) {
	var ok=setval(id,x,'errok');
	sethtml('text_'+id,x,errok);
	var o=el('text_'+id);
	if(o && o.hasAttribute('ph'))
		showplaceholder(o,id,(x==='')?1:0);
	return ok;
}

// focus
function focus(id,delay,errok,fromkey) {  // delay=1 for 0ms timeout, =2 for 0.1sec pause
	if(delay) return setTimeout(function() {focus(id,0,errok,fromkey)}, (delay>1)?100:0);
	var o=(typeof(id)=='string')? el('text_'+id) : id;
	if(!o) return logerr('focus('+id+') no such id text_'+id,errok);
	if(!o.isContentEditable) return;  // disabled
	if(fromkey && mini) {  // don't open calendar when navigate by keyboard on mini
		ignorepopcal=true;
		setTimeout(function() {ignorepopcal=false;},0);
	}
	o.focus();  // helps with bugs, calls focus event which calls focustext()
	if(o.hasAttribute('focustop')) {  // select before any text
		o.selectionStart=0;
		o.selectionEnd=0;
	}
	else if(self.platform!='iOS') {  // handled on focus event
		var sel=window.getSelection();
		var range=document.createRange();
		range.selectNodeContents(o);
		sel.removeAllRanges();
		sel.addRange(range);
	}
}

function focusp(id,delay) {  // password
	if(delay) return setTimeout(function() {focusp(id)}, (delay>1)?100:0);
	inp('text_'+id).focus();
}

// deselect text
function blurall(noevent) {
	if(textfocus && !noevent) textfocus.blur();
	textfocus0=false;
	window.getSelection().removeAllRanges();  // does not trigger blur events
}

// blur textbox and trigger onchange
function blur(o) {
	if(typeof(o)=='string') o=el('text_'+o);
	o.blur();  // triggers event which triggers blurit() which triggers onchange()
}

// standardize text input, save, and do onchange; called on blur or paste nodes
// called internally as cleantext(object)
// call manually as cleantext('id',true) to return cleaned text without redrawing or dochange
// call manually as cleantext(...,...,string) for given text
/*////OLD
function cleantext(o,getonly,x) {
	if(typeof(o)=='string') {
		var id=o;
		o=el('text_'+id);
		if(!o) {logit('cleantext no text_'+id); return x||'';}  // common js quirk
	}
	else var id=o.id.substr(5);
	var type=o.getAttribute('type');  // date,number,email,emaillist,url
	var br=o.hasAttribute('br');
	var format=o.getAttribute('format')-0 || 0;
	var limit=o.getAttribute('limit')-0 || 0;
	var caps=o.getAttribute('caps')-0 || 0;
	var tab=o.hasAttribute('tab');
	var bi=o.hasAttribute('bi');
	var keepspace=o.getAttribute('keepspace')-0 || 0;
	var anymath=false;

	// standarize html
	if(!x) x=o.innerHTML;
	var y='', i=0, t0, t1, s, c, string, g, tag, rawtag, closedblock, mid, latex, contam=false,
		opentags=[],  // tags to open
		closetags=[];  // tags to close
	// remove pasted tags
	while((t0=x.indexOf('<xml'))>=0) {  // regex doesn't work efficiently with newlines
		t1=x.indexOf('</xml>',t0);
		if(t1==-1) break;
		x=x.substring(0,t0)+x.substring(t1+6);
		contam=true;
	}
	while((t0=x.indexOf('<style'))>=0) {
		t1=x.indexOf('</style>',t0);
		if(t1==-1) break;
		x=x.substring(0,t0)+x.substring(t1+8);
		contam=true;
	}
	while((t0=x.indexOf('<!'))>=0) {
		t1=x.indexOf('>',t0);
		if(t1==-1) break;
		x=x.substring(0,t0)+x.substring(t1+1);
		contam=true;
	}
	// clean white space
	x=x.replace(/\r/g,'');  // x=input, y=output
	if(limit && format && x.length>limit)  // for formatting do this before to avoid unclosed tags; length is not exact; don't use limit for pod editing
		x=x.substr(0, limit + x.length - x.replace(/&amp;/gi,'&').length);  // &amp; counted as 1 char
	if(!tab || contam || x.indexOf('</p>')>=0 || x.indexOf('</div>')>=0)
		x=x.replace(/\n/g,' ');  // inner html uses <br> not \n, except if white-space:pre-wrap; Word pastes arbitrary \n
	if(!tab)
		x=x.replace(/\t/g,'     ');
	// remove illegal tags and attributes; clean tags; close tags in each line
	while(true) {
		tag='';
		t0=x.indexOf('<',i);  // start of tag
		if(bi) {  // or pipe, whichever is first
			t1=x.indexOf('|',i);
			if(t1!=-1 && (t1<t0 || t0==-1)) {
				tag='|';
				t0=t1;
			}
		}
		// string
		string=(t0==-1)? x.substring(i,x.length) : x.substring(i,t0);  // from i to <tag>
		if(string!='') {
			if(string.replace(/ /g,'')!='') {  // open tags unless string is empty or spaces only
				while(g=opentags.shift()) {
					if(y.substr(-g.length-3)=='</'+g+'>' && (g=='b' || g=='i' || g=='u' || g=='sub' || g=='sup' || g=='sm' || g=='color'))  // simplify <b>y</b><b>z</b>
						y=y.substr(0,y.length-g.length-3);  // remove close tag
					else
						y+='<'+g+'>';
					closetags.push(g);  // to be closed
				}
			}
			y+=string;
		}
		// tag
		if(t0==-1 || tag=='|')
			c=false;
		else {
			c=(x[t0+1]=='/');
			t1=x.indexOf('>',t0+1);
			if(t1==-1)  // broken tag like "<div" treated like end of text
				t0=-1, tag='', c=false;
			else {
				s=x.indexOf(' ',t0+1);
				tag=x.substring(t0+(c?2:1),(s<0 || s>t1)?t1:s).toLowerCase() || '?';  // tag, excluding /
				if(tag=='p') tag='div';
				if(format) {
					if(tag=='strong') tag='b';
					else if(tag=='em') tag='i';
					else if(tag=='ol') tag='ul';
				}
			}
		}
		i=t1+1;
		// character formatting
		if(
			format && ((tag=='b' || tag=='i' || tag=='u') && format!=2 ||
			format>=2 && (tag=='sup' || tag=='sub' || tag=='code' ||  // pod write-in, text-write
			format>=3 && tag=='sm' ||  // pod choice
			format>=5 && tag=='color'  // pod explanation/annotation
			))) {
			if(tag=='code') {  // math
				anymath=true;
				mid=x.substring(t0+6,t1);
				t1=x.indexOf('</code>',t0+1)+7;
				i=t1;
				mid=mid.match(/mathid[= "']+?(\d+)/);
				if(mid) {
					mid=mid[1];
					latex=(self.mqo && mqo[mid])? getlatex(mid) : '';
					if(latex) {
						y+='<code>'+latex+'</code>';
					}
				}
			}
			else if(!c) {  // open tag
				if(opentags.indexOf(tag)<0)
					opentags.push(tag);
			}
			else if(opentags.indexOf(tag)>=0) {  // close tag: ignore empty <b></b> (may be crossed like <b><i></b>)
				for(g=opentags.indexOf(tag); g<opentags.length; g++)  // remove from opentags
					opentags[g]=opentags[g+1];
				opentags.pop();
			}
			else if(tag==closetags[closetags.length-1]) {  // matches last open tag
				y+='</'+tag+'>';
				closetags.pop();
			}
		}
		// block formatting
		else if(!tag || tag=='|' ||  // end of text, end of pipe
			br && (tag=='br' || tag=='div' ||  // line breaks
			format>=5 && (tag=='ul' || tag=='li' ||  // pod explanation/annotation
			format>=6 && (tag=='h1' || tag=='center' || tag=='table' || tag=='td'  // pod question/slide
			))) ||
			format>=3.5 && tag=='img' ||  // student juno doc
			format>=4 && tag=='h2') {  // pod choice
			closedblock=false;
			while(g=closetags.pop()) {  // close tags at end of line/pipe
				y+='</'+g+'>';
				if(tag=='br' || tag=='div' || tag=='|' || tag=='li')  // and reopen at next (unless h1, center, table)
					opentags.unshift(g);
				if(g=='h1' || g=='center' || g=='h2') closedblock=true;
			}
			if(tag=='') break;  // end of text
			else if(tag=='br') {
				if(!closedblock && opentags[0]!='li')
					y+="\n";
			}
			else if(tag=='|')
				y+=' | ';  // any excess spaces will be simplified below
			else if(tag=='div' && !c) {  // <div> = <br>
				if(y!='' && y.substr(y.length-1,1)!="\n" && y.substr(y.length-5,5)!="</h1>" && y.substr(y.length-9,9)!="</center>" && y.substr(y.length-8,8)!="</table>")
					y+="\n";  // ignore <br> if after <br> </h1> </center> </table>; (not handled: <div>aaa</div>bbb)
			}
			else if(format<=2) {}
			else if((tag=='h1' || tag=='center' || tag=='li') && !c) {  // <h1> <center> <li>
				if(opentags.indexOf(tag)<0)
					opentags.push(tag);
			}
			else if(tag=='ul') {
				y+=(!c)? "<ul>" : "</ul>";
				if(c && opentags[0]=='li') opentags.shift();  // do not reopen <li> after </ul>
			}
			else if(tag=='table')
				y+=(!c)? "<table contenteditable=false>" : "</table>";
			else if(tag=='td')
				y+=(!c)? "<td contenteditable>" : "</td>";
			else if(tag=='img' || tag=='h2') {  // pod media (h2=audio/video wrapper)
				if(tag=='img') {
					while(g=opentags.shift()) {  // allow <center><img></center>
						y+='<'+g+'>';
						closetags.push(g);  // to be closed
					}
				}
				else if(tag=='h2') {  // whole block <h2>...</h2>
					t1=x.indexOf('</h2>',t0+1)+4;
					i=t1+1;
				}
				rawtag=x.substring(t0,t1+1);
				if(self.cleanmediatag)
					rawtag=cleanmediatag(rawtag,format);  // podedit.js; empty if <h2> in format<6
				y+=rawtag.replace(/"/g,String.fromCharCode(28));  // hide " from &quot; encoding, then recovert below
			}
		}
		// ignore any other tags
		else if(tag=='li' && format<=2 && br)  // convert bullet where <li> not supported
			y+="\n&bull; ";
		else if(tag=='tr' && c && format<=5)  // convert table row (except in pod)
			y+=(br)? "\n":' ';
		else if(tag=='td' && c)  // space between table cells
			y+=' ';
	}  // next tag
	x=y, y='';
	// remove excess spaces
	x=x.replace(/&nbsp;/gi,' ');
	if(tab) {  // 2+ spaces = tabs
		x=x.replace(/ {8}/g,"\t");  // every 8 spaces = tab
		x=x.replace(/^ {2,}/gm,"\t");  // 2-7 spaces at start of line = tab (if no 2nd tab)
		x=x.replace(/\t {2,}/g,"\t\t");  // 2-7 more spaces after tab = tab (2nd+ tab)
		x=x.replace(/\t /g,"\t");  // remove spare 1 space after tab
	}
	if(keepspace<3) {  // remove excess spaces  (3=keep spaces)
		x=x.replace(/  +/g,' ');  // max 1 space
		x=x.replace(/ $/gm,'');  // trailing spaces
		x=x.replace(/^ /gm,'');  // leading spaces
	}
	if(keepspace<2)  {  // remove excess breaks  (2+=keep lead/trail breaks)
		x=x.replace(/^\n+/g,'');  // trim leading breaks
		x=x.replace(/\n+$/g,'');  // trim trailing breaks
	}
	if(keepspace<1)  // remove medial breaks  (1+=keep medial breaks)
		x=x.replace(/\n{3,}/g,'\n\n');  // max 1 blank line
	// html entities & limit
	if(limit && !format && x.length>limit)  // for unformatted do this after for more accuracy, but it counts &lt; &amp; as multiple chars and may break it
		x=x.substr(0, limit + x.length - x.replace(/&amp;/gi,'&').length);  // &amp; counted as 1 char
	x=x.replace(/"/g,'&quot;');
	if(format>=3.5) x=x.replace(/\x1C/g,'"');  // restore quotes in tag attributes

	// clean type
	if(type=='number') x=cleannum(x, o.getAttribute('numberformat'), o.getAttribute('decimals'), o.getAttribute('min'), o.getAttribute('max'));
	else if(type=='date' && !o.hasAttribute('loose')) x=cleandate(x, o.hasAttribute('min'));
	else if(type=='time') x=cleantime(x, o.getAttribute('roundmin'));
	else if(type=='email') x=cleanemail(x);
	else if(type=='emaillist') x=cleanemail(x,true);
	else if(type=='url') x=cleanurl(x);
	else {
		if(caps) x=fixcaps(x,caps);
		// breaks as <br>
		x=x.replace(/\n/g,'<br>');
	}
	if(x=='' && o.hasAttribute('default')) x=o.getAttribute('default');
	// get only without saving
	if(getonly) return x;
	// show placeholder if empty
	if(x=='' && o.getAttribute('ph')+''=='0')
		showplaceholder(o,id,1);
	// redraw
	if(comparetext(x)!=comparetext(o.innerHTML))
		redrawtexttimer=setTimeout(function() {  // deferred bc math causes blur/focus between textbox and hidden textarea; wait for onfocus to see if actually leaving textbox
			redrawtexttimer=false;
			if(self.noredrawtext) return;  // global to suppress as needed
			o.innerHTML=x;
			if(anymath && self.mathloaded) initmathboxes(o);
			if(textfocus!=o) return;
			if(x.indexOf('<br>')>=0) {  // blur if multiple lines
				blurall(true);
				textfocus=false;
			}
			else {  // cursor at end
				while(o.nodeType==1 && o.lastChild) o=o.lastChild;
				window.getSelection().collapse(o, (o.nodeType==1)?0:o.length);
			}
		});
	// save, dochange
	var textinp=inp(id);
	if(x==(textinp? textinp.value : texthtml0)) return;  // if no input need texthtml0 from focus (which is n/a for quickscores)
	if(textinp) textinp.value=x;  // save cleaned text even if not redrawn
	if(o.hasAttribute('dochange')) {
		if(!textinp && self.drawfor!='dropbox') {
			logerr('missing input '+id+' for el '+o.id);
			if(!self.trapedge) {
				logassoc(document.form1.elements);
				trapedge=true;
				if(browser=='Edge') alert("Sorry, Edge is failing to save some of your data.\nUse Chrome instead.");
			}
		}
		changedtext=x, changedid=id;  // globals for dochange
		eval(o.getAttribute('dochange'));
		changedtext='', changedid='';
	}
}*/

function cleantext(o,getonly,x) {
	if(typeof(o)=='string') {
		var id=o;
		o=el('text_'+id);
		if(!o) {logit('cleantext no text_'+id); return x||'';}  // common js quirk
	}
	else var id=o.id.substr(5);
	var type=o.getAttribute('type');  // date,number,email,emaillist,url
	var br=o.hasAttribute('br');
	var format=o.getAttribute('format')-0 || 0;
	var limit=o.getAttribute('limit')-0 || 0;
	var caps=o.getAttribute('caps')-0 || 0;
	var tab=o.hasAttribute('tab');
	var bi=o.hasAttribute('bi');
	var keepspace=o.getAttribute('keepspace')-0 || 0;
	var anymath=false;
	///logcon(x);

	// standardize html
	if(!x) x=o.innerHTML;
	var y='', i=0, t0, t1, s, cl, string, g, tag, rawtag, mid, latex,
		contam=false,  // pasted from outside
		block=true,  // between blocks
		opentags=[],  // tags to open
		closetags=[];  // tags to close
	// remove pasted tags
	while((t0=x.indexOf('<xml'))>=0) {  // regex doesn't work efficiently with newlines
		t1=x.indexOf('</xml>',t0);
		if(t1==-1) break;
		x=x.substring(0,t0)+x.substring(t1+6);
		contam=true;
	}
	while((t0=x.indexOf('<style'))>=0) {
		t1=x.indexOf('</style>',t0);
		if(t1==-1) break;
		x=x.substring(0,t0)+x.substring(t1+8);
		contam=true;
	}
	while((t0=x.indexOf('<!'))>=0) {
		t1=x.indexOf('>',t0);
		if(t1==-1) break;
		x=x.substring(0,t0)+x.substring(t1+1);
		contam=true;
	}
	// clean white space
	x=x.replace(/\r/g,'');  // x=input, y=output
	if(limit && format && x.length>limit)  // for formatting do this before to avoid unclosed tags; length is not exact; don't use limit for pod editing
		x=x.substr(0, limit + x.length - x.replace(/&amp;/gi,'&').length);  // &amp; counted as 1 char
	if(!tab || contam || x.indexOf('</p>')>=0 || x.indexOf('</div>')>=0) {
		x=x.replace(/\n/g,' ');  // inner html uses <br> not \n, except if white-space:pre-wrap; Word pastes arbitrary \n
		///logit('convert n to space');
	}
	if(!tab)
		x=x.replace(/\t/g,'     ');
	// remove illegal tags and attributes; clean tags; close tags in each line
	while(true) {

		// FIND TAG or STRING
		tag='';
		t0=x.indexOf('<',i);  // start of tag
		if(bi) {  // or pipe, whichever is first
			t1=x.indexOf('|',i);
			if(t1!=-1 && (t1<t0 || t0==-1)) {
				tag='|';
				t0=t1;
			}
		}
		// string
		string=(t0==-1)? x.substring(i,x.length) : x.substring(i,t0);  // from i to <tag>
		if(string!='') {
			if(string.replace(/ /g,'')!='') {  // open tags unless string is empty or spaces only
				///logit('string');
				while(g=opentags.shift()) {  // pull first
					if(y.substr(-g.length-3)=='</'+g+'>' && (g=='b' || g=='i' || g=='u' || g=='sub' || g=='sup' || g=='sm' || g=='color')) {  // simplify <b>y</b><b>z</b>
						y=y.substr(0,y.length-g.length-3);  // remove close tag
						///logit('remove last </'+g+'>',1);
					}
					else {
						y+='<'+g+'>';
						///logit('<'+g+'> opentag',1);
					}
					closetags.push(g);  // append: to be closed
					///logit('push closetags </'+g+'>',1);
				}
				block=false;
				///logit('b0 '+string,1);
			}
			///else logit('empty string',1);
			y+=string;
		}
		// tag
		if(t0==-1 || tag=='|') {
			cl=false;
			///logit('end of text');
		}
		else if(tag=='|') {
			cl=false;
			///logit('pipe |');
		}
		else {
			cl=(x[t0+1]=='/');
			t1=x.indexOf('>',t0+1);
			if(t1==-1)  // broken tag like "<div" treated like end of text
				t0=-1, tag='', cl=false;
			else {
				s=x.indexOf(' ',t0+1);
				tag=x.substring(t0+(cl?2:1),(s<0 || s>t1)?t1:s).toLowerCase() || '?';  // tag, excluding /
				if(tag=='h3' || tag=='h4' || tag=='h5' || tag=='h6') tag='div';
				else if(tag=='h2' && format<4) tag='div';
				else if((tag=='h1' || tag=='center' || tag=='table' || tag=='tr') && format<6) tag='div';  // td is converted to space
				else if(tag=='ul' && format<5) tag='div';  // li is converted to bullet
				else if(tag=='ol') tag='ul'
				if(format) {
					if(tag=='strong') tag='b';
					else if(tag=='em') tag='i';
				}
			}
			var wholetag='<'+(cl?'/':'')+tag+'>';
			///logit(wholetag);
		}
		i=t1+1;

		// CHARACTER formatting
		if(
			format && ((tag=='b' || tag=='i' || tag=='u') && format!=2 ||
			format>=2 && (tag=='sup' || tag=='sub' || tag=='code' ||  // pod write-in, text-write
			format>=3 && tag=='sm' ||  // pod choice
			format>=5 && tag=='color'  // pod explanation/annotation
			))) {
			if(tag=='code') {  // math
				anymath=true;
				mid=x.substring(t0+6,t1);
				t1=x.indexOf('</code>',t0+1)+7;
				i=t1;
				mid=mid.match(/mathid[= "']+?(\d+)/);
				if(mid) {
					mid=mid[1];
					latex=(self.mqo && mqo[mid])? getlatex(mid) : '';
					if(latex)
						y+='<code>'+latex+'</code>';
				}
			}
			else if(!cl) {  // open char tag
				if(opentags.indexOf(tag)<0) {
					opentags.push(tag);  // append
					///logit('push opentags <'+tag+'>',1);
				}
			}
			else if(opentags.indexOf(tag)>=0) {  // close char tag: ignore empty <b></b> (may be crossed like <b><i></b>)
				for(g=opentags.indexOf(tag); g<opentags.length; g++)  // remove from opentags
					opentags[g]=opentags[g+1];
				opentags.pop();  // dispose last
				///logit('forget opentags <'+tag+'>',1);
			}
			else if(tag==closetags[closetags.length-1]) {  // matches last open tag
				y+='</'+tag+'>';
				///logit('</'+tag+'> closetag',1);
				closetags.pop();  // pull last
			}
			block=false;
			///logit('b0 char tag',1);
			continue;
		}

		// BLOCK formatting
		else if(!tag || tag=='|' ||  // end of text, end of pipe
			tag=='br' || tag=='div' || tag=='p' ||  // line breaks
			tag=='img' ||  // 3.5+ student juno doc
			tag=='h2' ||  // 4+ pod choice (h2=audio)
			tag=='ul' || tag=='li' && !cl ||  // 5+ pod explanation/annotation
			tag=='h1' || tag=='center' || tag=='table' || tag=='td'  // 6+ pod question/slide (tr for paste conversion only)
			) {

			if(br || tag=='|' || tag=='') {
				while(g=closetags.pop()) {  // pull last: close tags at end of line/pipe
					y+='</'+g+'>';
					///logit('</'+g+'> closetag',1);
					if(br && g!=tag && (g=='b' || g=='i' || g=='u' || g=='sup' || g=='sub' || g=='sm' || g=='color' || g=='center' || g=='h1')) {  // and reopen at next block
						opentags.unshift(g);  // prepend
						///logit('prepush opentags <'+g+'> to reopen',1);
						if(tag=='br' && (g=='center' || g=='h1')) {  // prevent <br>
							tag='*';
							///logit('cancel <br> after closing '+g,1);
						}
					}
				}
			}
			if(tag=='') break;  // end of text
			if(!br && tag!='|') {  // reject all block tags
				if(y!='') {  // convert block/img to space if single line
					y+=' ';  // extra spaces cleaned at end
					///logit('convert '+wholetag+' to space',1);
				}
				continue;
			}
			if(tag=='p' && cl && block=='p') {  // <p></p> becomes <br>, but not other empty blocks like <div></div>
				y+="\n";
				///logit('empty p',1);
				block=true;
				continue;
			}
			if(cl && tag!='br' && tag!='img' && y.substr(y.length-1,1)=="\n") {  // remove <br> before closing tag like <br></div>
				y=y.substr(0,y.length-1);
				///logit('b0 remove last <br>',1);
				block=false;
			}
			if(tag=='p' && block && !cl) {
				if(block!='p') logit('set block=p',1);
				block='p';
			}
			else if(tag=='br' || tag=='div' && !block || tag=='p' && !block) {
				y+="\n";
				///if(tag=='br') logit('<br>',1); else logit(wholetag+' as <br>',1);
				///if(!block) logit('b1',1);
				block=true;
				continue;
			}
			else if(tag=='|') {
				y+=' | ';  // any excess spaces will be simplified below
				block=true;
				///logit('b1 |',1);
				continue;
			}
			else if(tag=='li' && !cl && format<5) {  // if incompatible convert <li> to •  (no </li>)
				y+=(block)? "&bull; ":"\n&bull; ";
				block=true;  // <li><p>...</p>
				///logit('b0 convert <li> to '+((block)?"•":"<br>•"),1);
				continue;
			}
			else if(tag=='li' || tag=='ul') {  // <ul> <li> </ul> (no </li>)
				y+=wholetag;
				///logit(wholetag,1);
				///if(!block) logit('b1',1);
				block=true;
				continue;
			}
			else if((tag=='h1' || tag=='center') && !cl) {  // <h1> <center>
				if(opentags.indexOf(tag)<0) {
					opentags.push(tag);  // append
					///logit('push opentags <'+tag+'>',1);
				}
				///if(!block) logit('b1',1);
				block=true;
				continue;
			}
			else if(tag=='table') {
				y+=(!cl)? "<table contenteditable=false>" : "</table>";
				///logit((!cl)? "<table contenteditable=false>" : "</table>", 1);
				///if(!block) logit('b1',1);
				block=true;
				continue;
			}
			else if(tag=='td') {
				if(format>=6) {
					y+=(!cl)? "<td contenteditable>" : "</td>";
					///logit((!cl)? "<td contenteditable>" : "</td>", 1);
					///if(!block) logit('b1',1);
					block=true;
					continue;
				}
				else if(cl) {
					y+=' ';  // extra spaces cleaned at end
					///logit('b0 convert </td> to space',1);
					block=false
					continue;
				}
			}
			else if(tag=='img' || tag=='h2') {  // pod media (h2=audio/video wrapper)
				if(tag=='img' && format<3.5) {
					y+=' ';
					///logit('convert <img> to space',1);
				}
				else {
					var centered=(opentags.indexOf('center')>=0);
					opentags=[], closetags=[];  // discard character formatting, etc around image, audio
					if(tag=='h2') {  // whole block <h2>...</h2>
						t1=x.indexOf('</h2>',t0+1)+4;
						i=t1+1;
					}
					rawtag=x.substring(t0,t1+1);
					if(self.cleanmediatag)
						rawtag=cleanmediatag(rawtag,format);  // podedit.js; empty if <h2> in format<6
					if(centered) y+='<center>';
					y+=rawtag.replace(/"/g,String.fromCharCode(28));  // hide " from &quot; encoding, then recovert below
					if(centered) y+='</center>';
					if(centered) {
						opentags.push('center');
						///logit('wrap in <center>',1);
					}
					///logit('b0 whole '+wholetag,1);
					block=true;
				}
				continue;
			}
		}
		///logit('ignore '+wholetag,1);
	}  // next tag

	// TIDY UP
	x=y, y='';
	// remove excess spaces
	x=x.replace(/&nbsp;/gi,' ');
	if(tab) {  // 2+ spaces = tabs
		x=x.replace(/ {8}/g,"\t");  // every 8 spaces = tab
		x=x.replace(/^ {2,}/gm,"\t");  // 2-7 spaces at start of line = tab (if no 2nd tab)
		x=x.replace(/\t {2,}/g,"\t\t");  // 2-7 more spaces after tab = tab (2nd+ tab)
		x=x.replace(/\t /g,"\t");  // remove spare 1 space after tab
	}
	if(keepspace<3) {  // remove excess spaces  (3=keep spaces)
		x=x.replace(/  +/g,' ');  // max 1 space
		x=x.replace(/ $/gm,'');  // trailing spaces
		x=x.replace(/^ /gm,'');  // leading spaces
	}
	if(keepspace<2)  {  // remove excess breaks  (2+=keep lead/trail breaks)
		x=x.replace(/^\n+/g,'');  // trim leading breaks
		x=x.replace(/\n+$/g,'');  // trim trailing breaks
	}
	if(keepspace<1)  // remove medial breaks  (1+=keep medial breaks)
		x=x.replace(/\n{3,}/g,'\n\n');  // max 1 blank line
	// html entities & limit
	if(limit && !format && x.length>limit)  // for unformatted do this after for more accuracy, but it counts &lt; &amp; as multiple chars and may break it
		x=x.substr(0, limit + x.length - x.replace(/&amp;/gi,'&').length);  // &amp; counted as 1 char
	x=x.replace(/"/g,'&quot;');
	if(format>=3.5) x=x.replace(/\x1C/g,'"');  // restore quotes in tag attributes

	// clean type
	if(type=='number') x=cleannum(x, o.getAttribute('numberformat'), o.getAttribute('decimals'), o.getAttribute('min'), o.getAttribute('max'));
	else if(type=='date' && !o.hasAttribute('loose')) x=cleandate(x, o.hasAttribute('min'));
	else if(type=='time') x=cleantime(x, o.getAttribute('roundmin'));
	else if(type=='email') x=cleanemail(x);
	else if(type=='emaillist') x=cleanemail(x,true);
	else if(type=='url') x=cleanurl(x);
	else {
		if(caps) x=fixcaps(x,caps);
		// breaks as <br>
		x=x.replace(/\n/g,'<br>');
	}
	if(x=='' && o.hasAttribute('default')) x=o.getAttribute('default');
	// get only without saving
	if(getonly) return x;
	// show placeholder if empty
	if(x=='' && o.getAttribute('ph')+''=='0')
		showplaceholder(o,id,1);
	// redraw
	if(comparetext(x)!=comparetext(o.innerHTML))
		redrawtexttimer=setTimeout(function() {  // deferred bc math causes blur/focus between textbox and hidden textarea; wait for onfocus to see if actually leaving textbox
			redrawtexttimer=false;
			if(self.noredrawtext) return;  // global to suppress as needed
			o.innerHTML=x;
			if(anymath && self.mathloaded) initmathboxes(o);
			if(textfocus!=o) return;
			if(x.indexOf('<br>')>=0) {  // blur if multiple lines
				blurall(true);
				textfocus=false;
			}
			else {  // cursor at end
				while(o.nodeType==1 && o.lastChild) o=o.lastChild;
				window.getSelection().collapse(o, (o.nodeType==1)?0:o.length);
			}
		});
	// save, dochange
	var textinp=inp(id);
	if(x==(textinp? textinp.value : texthtml0)) return;  // if no input need texthtml0 from focus (which is n/a for quickscores)
	if(textinp) textinp.value=x;  // save cleaned text even if not redrawn
	if(o.hasAttribute('dochange')) {
		if(!textinp && self.drawfor!='dropbox') {
			logerr('missing input '+id+' for el '+o.id);
			if(!self.trapedge) {
				logassoc(document.form1.elements);
				trapedge=true;
				if(browser=='Edge') alert("Sorry, Edge is failing to save some of your data.\nUse Chrome instead.");
			}
		}
		changedtext=x, changedid=id;  // globals for dochange
		eval(o.getAttribute('dochange'));
		changedtext='', changedid='';
	}
}

function comparetext(x) {
	x=x.replace(/\r?\n/g,'<br>');
	x=x.replace(/&nbsp;/gi,' ');
	x=x.replace(/ ?<code.+?\/code> ?/g,'<+>');
	return x;
}

// format
function richformat(w) {  // w = bold, italic, underline
	if(!textfocus) return;
	var f=textfocus.getAttribute('format');
	if(!f || f==2) return;
	document.execCommand(w,false,null);  // this changes focus in such a way that changes are not detected
}

// on focus textbox, set vars
document.addEventListener('focus', function(e) {  // bug: ios may select text if you click near it, without firing a focus event
	if(!e.target.isContentEditable) return;
	var o=gettarget(e.target);
	if(!o) {textfocus0=null; return;}
	var mq=e.target.hasAttribute('data-mq');
	if(mq) focusmath(0);  // open algebra keyboard if none open
	if(!mq || o!=self.textfocus0)
		focustext(o);
	else {  // don't redraw if focus moving in/out of mathbox (but dochange was already executed on blur)
		textfocus=textfocus0;
		if(self.redrawtexttimer) {
			clearTimeout(redrawtexttimer);
			redrawtexttimer=false;
		}
	}
},true);

function focustext(o) {
	textfocus=textfocus0=o;
	texthtml0=o.innerHTML;
	if(o.getAttribute('type')=='date') {
		if(self.ignorepopcal)
			return ignorepopcal=false;
		else {
			if(mini) {  // open calendar but not keyboard
				ignoreblur=true;
				o.blur();
			}
			popcal(o.id.substr(5), o.getAttribute('min'), o.getAttribute('max'), o.getAttribute('caldef'));
		}
	}
	if(o.hasAttribute('dofocus'))
		eval(o.getAttribute('dofocus'));
	if(o.hasAttribute('formatbtns') && !touchos)
		setviz('formatbtns_'+o.id.substr(5),1);
	else if(o.hasAttribute('format') && !touchos && el('boldbtn')) {
		setstyle('boldbtn','btn');
		setstyle('italicbtn','btn');
		setstyle('underlinebtn','btn');
	}
}

// on blur textbox
document.addEventListener('blur', function(e) {
	if(!e.target.isContentEditable || e.target.type=='password' || e.target.type=='textarea' && !e.target.hasAttribute('data-mq')) return;
	if(!textfocus) return;
	if(self.ignoreblur) return ignoreblur=false;
	var o=gettarget(e.target);
	if(o!=textfocus) return;
	blurit(o,true);
},true);

function blurit(o,fromevent) {
	if(o.hasAttribute('formatbtns') && !touchos)
		setviz('formatbtns_'+o.id.substr(5),0);
	else if(o.hasAttribute('format') && !touchos) {
		var b=el('boldbtn');
		if(b && !b.getAttribute('nohide')) {
			setstyle('boldbtn','hide');
			setstyle('italicbtn','hide');
			setstyle('underlinebtn','hide');
		}
	}
	if(!mini) hidecal();
	if(o.innerHTML!==texthtml0) cleantext(o);  // fires onchange
	else if((texthtml0=='' || texthtml0=='<br>') && o.getAttribute('ph')+''=='0')  // browsers are inconsistent about empty vs <br> so typing & erasing text may or may not cleantext()
		showplaceholder(o,o.id.substr(5),1);
	if(o.hasAttribute('doblur'))
		eval(o.getAttribute('doblur'));
	textfocus0=textfocus;
	textfocus=false;
}

// after delete, typing may reapply the style; webkit uses <span style="...">, so delete style; firefox/edge/ie uses tag like <sub>, which can't be distinguished from bad tags
domwatch = new MutationObserver(function() {
	if(!textfocus || self.domwatchflag || textfocus.innerHTML.indexOf('style="')<0) return;
	var n=window.getSelection().anchorNode;
	if(!n) return;
	n=n.parentNode;
	if(n.id || !n.getAttribute('style')) return;
	if(n.className && n.className.indexOf('mq-')>=0 || n.parentNode.className && n.parentNode.className.indexOf('mq-')>=0) return;
	domwatchflag=true;
	n.removeAttribute('style');  // leave <span> to be purged on cleantext()
	setTimeout(function() {domwatchflag=false});
});

document.addEventListener('paste', function(e) {
	var o=gettarget(e.target);
	if(!o) return;
	if(self.prepaste) {  // specialchars math
		var ok=prepaste(o);
		if(ok===false) {e.preventDefault(); return;}
	}
	lastact=Date.now();
	if(o.getAttribute('ph')-0)
		showplaceholder(o,o.id.substr(5),0);
	// clean html clipboard
	if(e.clipboardData && e.clipboardData.getData && o.isContentEditable) {
		var x = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
		if(x && x.indexOf('<code ')<0) {  // let math do natural paste for <code> attributes etc
			x=cleantext(o,true,x);
			typestring(x);
			e.preventDefault();
		}  // else let plain text paste for undo
	}
	setTimeout(function() {  // text updates after paste event
		if(self.postpaste) {
			var ok=postpaste(o);
			if(ok===false) return;
		}
		if(self.postpaste2) {
			var ok=postpaste2(o);
			if(ok===false) return;
		}
		///if(ok) cleantext(o);  // don't risk redrawing and losing caret; upstream paste should be clean enough; but do clean for postpaste()
		if(o.hasAttribute('doinput')) eval(o.getAttribute('doinput'));
	});
},true);

document.addEventListener('cut', function(e) {
	var o=gettarget(e.target);
	if(!o) return;
	if(self.oncut) {  // specialchars math
		var ok=oncut(o);
		if(ok===false) {e.preventDefault(); return;}
	}
	lastact=Date.now();
	if(o.hasAttribute('doinput')) setTimeout(function() {  // text updates after paste event
		eval(o.getAttribute('doinput'));
	});
},true);

document.addEventListener('copy', function(e) {
	if(!self.oncopy) return;  // specialchars math
	var o=gettarget(e.target);
	if(!o) return;
	oncopy(o);
},true);

function fixcaps(string,maxacro) {
	if(string=='') return '';
	var k,i,y,word,len;
	string=unhtml(string);
	var sep=" ,.-/&()[]\"“”";  // not apostrophes
	string=string.split('\n');
	for(k=0; k<string.length; k++) {
		x=string[k];
		if(x!=x.toUpperCase() && x!=x.toLowerCase()) continue;  // no change if already mixed case
		y='', word='', len=x.length;
		for(i=0; i<=len; i++) {
			if(i!=len && sep.indexOf(x.substr(i,1))==-1)  // continue word
				word+=x.substr(i,1);
			else {  // end word
				if(word.length<=maxacro && word==word.toUpperCase()) y+=word;
				else if(word.substr(0,2).toUpperCase()=='MC') y+='Mc'+word.substr(2,1).toUpperCase()+word.substr(3).toLowerCase();  // capitalize McDonnel
				else if(word.substr(1,1)=="'" && word.length>=4) y+=word.substr(0,3).toUpperCase()+word.substr(3).toLowerCase();  // capitalize O'Leary D'Angelo (not D's)
				else y+=word.substr(0,1).toUpperCase()+word.substr(1).toLowerCase();
				y+=x.substr(i,1);
				word='';
			}
		}
		string[k]=y;
	}
	return string.join('\n');
}

// format number from string x; returns empty string if not a number
function cleannum(x,format,decimals,min,max) {
	if(!format) format='';
	var pattern=(min<0)? '[^0-9.-]' : '[^0-9.]';
	var ya=[], y, i;
	x=String(x).split('<br>');
	for(i=0; i<x.length; i++) {  // may be rows of numbers
		y=String(x[i]).replace(new RegExp(pattern,'g'),'');
		if(isNaN(y-0) || y=='') continue;
		if(min!==null && y-0<min) y=min;
		if(max!==null && y-0>max) y=(max==0)? -y:max;
		if(decimals>=1) y=fixit(y,decimals);
		else if(decimals<=0 && decimals!==null) {
			var z=roundit(y,-decimals);
			if(decimals==-2 && format.indexOf('$')>=0)  // if format $ with -2 decimals, show $5 not $5.00, $5.10 not $5.1
				y=(z==Math.floor(z))? z : fixit(y,2);
			else if(y-0!=z) y=z;  // keep extra zeros if any; change only if too many decimals /// I don't remember why
		}
		if(format.indexOf(',')>=0) y=number_format(y);
		if(format.indexOf('+')>=0 && y-0>0) y='+'+y;  // show positive sign
		if(format.indexOf('%')>=0) y+='%';  // show percent sign
		if(format.indexOf('$')>=0) y='$'+y;  // show dollar sign
		ya[i]=y;
	}
	return ya.join('<br>');
}

// clean date, either m/d or m/d/y
function cleandate(mdy,noyear) {
	mdy=repstr(' ','',mdy);  // remove spaces
	mdy=filter(mdy,'0123456789/','/');  // change any other punctuation to slash, like 12-31-99 or 12.31.99
	mdy=mdy.split('/');
	var m=mdy[0]-0;
	var d=mdy[1]-0;
	var y=mdy[2];
	if(m<1 || m>12 || isNaN(m)) return '';  // blank if missing/invalid month
	if(d<1 || d>31 || isNaN(d)) return '';  // blank if missing/invalid date (doesn't validate number of days in month)
	if(noyear) return m+'/'+d;
	if(y=='' || isNaN(y-0)) return '';
	y=(y-0)%100;
	if(y<=9) y='0'+y;
	return m+'/'+d+'/'+y;
}

// clean time; format 8:00 pm
function cleantime(hma,roundmin) {
	var h,m,ap;
	hma=repstr(' ','',hma);  // remove spaces
	hma=hma.toLowerCase();
	if(hma.indexOf('a')>=0) ap='am';
	else if(hma.indexOf('p')>=0) ap='pm';
	hma=filter(hma,'0123456789:',':');  // change any other punctuation to colon, like 5.30
	hma=hma.split(':');
	h=hma[0]-0;
	m=(hma[1])? hma[1]-0 : 0;
	if(!hma[0] || h>=24 || m>=60) return '';
	if(h==0) {h=12; ap='am';}  // convert military time
	else if(h>=13 && h<=23) {h-=12; ap='pm';}  // "
	if(roundmin) m=Math.floor(m/roundmin)*roundmin;
	if(m<=9) m='0'+m;
	if(!ap) ap=(h>=7 && h<12)? 'am':'pm';
	return h+':'+m+' '+ap;
}

// erase invalid email addresses; multi true for multiple emails
function cleanemail(x,multi) {
	x=x.replace(/\.{2,}/g,'.');  // auto-correct 2+ dots to one
	var y='', sep='';
	pattern=new RegExp("[a-z0-9.\\-_'`\\/!#$%&*+=?^{|}~]+@[a-z0-9][a-z0-9.\\-]*\\.[a-z]{2,}","gi");
	while(matches=pattern.exec(x)) {  // each address
		var email=matches[0];
		if(email.charAt(0)=='.') email=email.substr(1);  // auto-correct dot before address
		email=repstr('.@','@',email);  // auto-correct dot before @
		if(email==email.toUpperCase())  // change all-caps to lowercase
			email=email.toLowerCase();
		y+=sep+email;
		if(!multi) break;
		sep=', ';
	}
	return y;
}

// erase invalid url
function cleanurl(x) {
	return (x.indexOf('.')==-1 || x.indexOf(' ')!=-1 || x.indexOf('@')!=-1 && x.indexOf('://')==-1)? '':x;
}

// format phone as 000-000-0000; pad ? if short
function cleanphone10(x) {
	x=x.replace(/[^0-9]/g,'');
	if(x!='') {
		if(x.length>=11 && x.substr(0,1)=='1') x=x.substr(1,10);  // remove +1 country code
		else if(x.length>10) x=x.substr(0,10);  // clip end
		else if(x.length<10)  // prefix ?'s
			x='??????????'.substr(0,10-x.length)+x;
		x=x.substr(0,3)+'-'+x.substr(3,3)+'-'+x.substr(6,4);
	}
	return x;
}

// insert string or html at cursor
function typestring(text) {
	var html=(text.indexOf('<')>=0);
	if(window.getSelection) {
		var sel=window.getSelection();
		if(sel.getRangeAt && sel.rangeCount) {
			var node,lastnode;
			if(!html) {
				text=text.replace(/&quot;/g,'"');
				text=text.replace(/&lt;/g,'<');
				text=text.replace(/&gt;/g,'>');
				text=text.replace(/&amp;/g,'&');
				var frag=(lastnode=document.createTextNode(text));
			}
			else {
				var div=document.createElement('div');
				div.innerHTML=text;
				var frag=document.createDocumentFragment();
				while((node=div.firstChild)) lastnode=frag.appendChild(node);
			}
			var range=sel.getRangeAt(0);
			range.deleteContents();
			range.insertNode(frag);
			range.setStartAfter(lastnode);  // move cursor after insertion
			range.collapse(true);
			sel.removeAllRanges();
			sel.addRange(range);
		}
	}
	else if(!html && document.selection && document.selection.createRange)
		document.selection.createRange().text=text;
	else if(html && document.selection && document.selection.type!='Control')  // msie<9
		document.selection.createRange().pasteHTML(html);
}

// get selected text
// t1=html before selection, t2=html within selection, t3=html after selection
function getcaret() {
	var a,b,x,x0,r,range,div;
	var sel=document.getSelection();
	for(r=0; r<sel.rangeCount; r++) {  // firefox may have multiple ranges when cross <td>
		range=sel.getRangeAt(r).cloneRange();
		range.setStart(textfocus,0);  // end offset
		div=document.createElement('div');
		div.appendChild(range.cloneContents().cloneNode(true));
		x=div.innerHTML;
		do {  // remove closing tags that js adds to documentFragment
			x0=x, x=x.replace(/<\/[^>]+>$/,'');
		} while(x!=x0);
		if(!r || x.length>b) b=x.length;
		range.setEnd(sel.getRangeAt(r).startContainer, sel.getRangeAt(r).startOffset);  // start offset
		div=document.createElement('div');
		div.appendChild(range.cloneContents().cloneNode(true));
		x=div.innerHTML;
		do {  // "
			x0=x, x=x.replace(/<\/[^>]+>$/,'');
		} while(x!=x0);
		if(!r || x.length<a) a=x.length;
	}
	x=textfocus.innerHTML;
	t1=x.substring(0,a).replace(/\n/g,'<br>');
	t2=x.substring(a,b).replace(/\n/g,'<br>');
	t3=x.substring(b,x.length).replace(/\n/g,'<br>');
}

// return true if url is external
function validurl(src,keepraw) {
	if(src.substr(0,4)=='http') {  // url: validate domain
		var it=/https?:\/\/(.+?)\//.exec(src);
		if(!it) return;
		var domain=it[1];
		if(domain.charAt(0)=='.') return;  // discard ../
		if(domain.substring(0,5)=='file:') return;  // discard http://file:///
		if(domain.charAt(0)-0) return;  // discard any IP address (even ipv6 always starts 1-9)
		if(domain.substr(0,9)=='localhost') return;
		if(domain.substr(domain.length-6,6)=='.local') return;  // discard http://localhost/ http://macname.local/...
	}
	else if(!(keepraw && src.substr(0,11)=='data:image/'))  // data:image/png;base64,iVBORw0KG... (firefox is the only browser that pastes data)
		return;  // discard blob:http:..., webkit-fake-url:
	return true;
}


// CHECKBOX

// Draw Checkbox
function checkbox(id,label,checked,script,att,disabled,draw) {
	if(!att) att={};
	else if(typeof(att)!='object') logerr("checkbox("+id+") att should be object");
	if(att.disabled) disabled=true;
	var sublabel='', c=label.indexOf('{br}');
	if(c!=-1) {
		if(mini) {
			sublabel=repstr('{br}','<br>',label.substr(c+4,label.length));
			label=label.substr(0,c);
		}
		else label=repstr('{br}',' ',label);
	}
	var fill=disabled? '#e0e0e0':'white';
	if(id) {
		var html=
'<input type=hidden name='+id;
		if(checked==2) html+=' value=2';
		else if(checked) html+=' value='+(att.value? '"'+att.value+'"' : 1);
		html+='>\n'+
'<div id='+id+'_script';
	}
	else var html=
'<div';
	html+=' class=';
	html+=(att.width)? '"widgetspace cliptext" style="max-width:'+att.width+'px; vertical-align:-4px;"': 'widgetspace';
		// unwanted space at bottom if both inline-block (widgetspace) and overflow:hidden (cliptext), so try vertical-align
	if(att.value) html+=' val="'+att.value+'"';
	if(!disabled) {
		html+=" click=\"clickcheck('"+id+"')\"";
		if(script) html+=' dochange="'+script+'"';
	}
	else if(att.tip) html+=" click='showtip()'";
	if(att.tip) html+=' tip="'+att.tip+'"';
	if(att.html) html+=' '+att.html;
	html+='>\n'+
'	<svg class='+(label==''?'widget0':'widget')+'>\n'+
'		<rect id='+id+'_box x=1.5 y=1.5 width=15 height=15 rx=3.5 ry=3.5 fill='+fill+' class=widgetstroke stroke-width=1 />\n'+
'		<polyline id='+id+'_check points="4.5,8 8.5,12 14,3.5" stroke-width=3 stroke='+((checked && checked!=2)?'black':'none')+' fill=none />\n';
	if(checked==2) html+=
'		<circle id='+id+'_checkmixed cx=9 cy=9 r=3.5 class=widgetfill />\n';
	else if(att.mixed) html+=
'		<circle id='+id+'_checkmixed cx=9 cy=9 r=3.5 class=widgetfill style="opacity:0" />\n';
	if(label==' ') label='';
	html+=
'	</svg>'+label+
'</div>';
	if(sublabel) html+=(!att.inline)?
		'<div class="indent subwidget">'+sublabel+'</div>':
		'<span class=indent>'+sublabel+'</span>';
	else if(!att.inline) html+='<br>';  // see comment above  /// && !att.width no longer needed if cliptext above is inline-block
	if(draw) document.write(html);
	else return html;
}

function clickcheck(id) {
	var mixed=el(id+'_checkmixed','errok');
	if(mixed && mixed.getAttribute('nomixed')) mixed=null;
	if(mixed) {  // mixed three-way
		var val0=val(id);
		if(val0==2) checked=1;
		else if(val0==1) checked='';
		else checked=2;
		el(id+'_check').style.stroke=(checked==1)? 'black':'none';
		mixed.style.opacity=(checked==2)? 1:0;
	}
	else {  // normal two-way
		if(val(id)) var checked='';
		else var checked=el(id+'_script').getAttribute('val') || 1;
		el(id+'_check').style.stroke=(checked)? 'black':'none';
	}
	el(id+'_box').style.fill='white';
	setval(id,checked);
	var script=el(id+'_script').getAttribute('dochange');
	if(script) eval(script);
}

// Set Checkbox
function setcheck(id,checked,dochange,errok) {
	if(errok && !el(id+'_check')) return;
	var mixed=el(id+'_checkmixed','errok');
	if(mixed && mixed.getAttribute('nomixed')) mixed=null;
	if(mixed) {
		if(checked!=2) checked=checked? 1:'';
	}
	else if(checked) {
		var o=el(id+'_script','errok');
		if(o) checked=o.getAttribute('val') || 1;
	}
	else checked='';
	var ok=setval(id,checked,errok);
	if(!ok) return logerr('setcheck('+id+') no such id',errok);
	el(id+'_check').style.stroke=(checked && !(mixed && checked==2))? 'black':'none';
	if(mixed) mixed.style.opacity=(checked==2)? 1:0;
	if(!dochange) return;
	var script=el(id+'_script').getAttribute('dochange');
	if(script) eval(script);
}
function check(id,dochange,errok) {///statereporting may have wrong params
	setcheck(id,1,dochange,errok);
}
function uncheck(id,dochange,errok) {///"
	setcheck(id,0,dochange,errok);
}
function setmixed(id,x,errok) {  // x=false to disabled mixed status of checkbox; true to enable; checkbox must be initially defined with checked=2
	var o=el(id+'_checkmixed');
	if(!o) {
		if(!errok) logerr('setmixed no id='+id);
		return;
	}
	o.setAttribute('nomixed',x?'':1);
	if(!x) o.style.opacity=0;
}
///temp patch state reporting scripts
function checked(id,errok) {
	return Boolean(val(id,false,errok));
}



// RADIO BUTTON

radios=[];  // radios[id][1+]=value; (set radios[id]=null before redrawing radios with same id)
radioselects=[];  // radios[id]=value

// Draw Radio Button
function radio(id,v,label,selected,script,att,disabled,draw) {
	if(!att) att={};
	else if(typeof(att)!='object') logerr("radio("+id+") att should be object");
	if(att.disabled) disabled=true;
	var fill=disabled? '#e0e0e0':'white';
	var html='';
	if(!radios[id]) {
		radios[id]=[];
		radioselects[id]=(typeof(selected)=='boolean')? undefined:selected;
		var i=1;
		html+=
'<input type=hidden name='+id+' value="'+((selected!==false && selected!==null)?selected:'')+'">\n';
	}
	else var i=radios[id].length;
	v+='';  // always save a strings
	radios[id][i]=v;
	var blankok=(att.blankok)? ',1':'';
	if(selected===true && radioselects[id]!==undefined) {selected=false; logit(id+' has multiple selections');}  // don't allow multiple selections
	if(selected===true) {
		var checked=true;
		radioselects[id]=v;
		if(draw) html+=
"<script>setval('"+id+"',\""+v+"\")</script>\n";
		else setTimeout(function() {setval(id,v);},0);
	}
	else if(selected===false)
		var checked=false;
	else
		var checked=(v==radioselects[id]);
	html+=
'<div id='+id+'_'+i+' class=';
	html+=(att.width)? '"widgetspace cliptext" style="max-width:'+att.width+'px; vertical-align:-4px;"': 'widgetspace';
		// unwanted space at bottom if both inline-block (widgetspace) and overflow:hidden (cliptext), so try vertical-align
	if(!disabled) {
		html+=' click=\'clickradio("'+id+'",'+i+blankok+')\'';
		if(script) html+=' dochange="'+script+'"';
	}
	else if(att.tip) html+=" click='showtip()'";
	if(att.tip) html+=' tip="'+att.tip+'"';
	if(att.html) html+=' '+att.html;
	html+='>\n'+
'	<svg class=widget>\n'+
'		<circle id='+id+'_'+i+'_circle cx=9 cy=9 r=8 fill='+fill+' class=widgetstroke stroke-width=1 />\n'+
'		<circle id='+id+'_'+i+'_radio cx=9 cy=9 r=3.5 fill='+(checked?'black':'none')+' />\n'+
'	</svg>'+label+'\n'+
'</div>';
	if(!att.inline) html+='<br>'; /// && !att.width no longer needed if cliptext above is inline-block
	if(draw) document.write(html);
	else return html;
}

function clickradio(id,i,blankok,dochange) {  // blankok true to allow no radio selection, like gender unknown
	var i0=radios[id].indexOf(val(id,true));
	if(i==i0) {  // no change
		if(blankok) {
			setval(id,'');
			if(i>=1) el(id+'_'+i+'_radio').style.fill='none';
			else i=1;  // which script to do
		}
		else return;
	}
	else {
		setval(id,radios[id][i]);
		if(i0>0) el(id+'_'+i0+'_radio').style.fill='none';
		el(id+'_'+i+'_radio').style.fill='black';
		setradioreq(id,false);
	}
	if(dochange===false) return;  // undefined if click radio, true/false if setradio()
	var script=el(id+'_'+i).getAttribute('dochange');
	if(script) eval(script);
}

// Set Radio Buttons
function setradio(id,v,dochange,errok) {
	if(radios[id]) {
		var i=radios[id].indexOf(v+'');
		if(i!=-1) clickradio(id,i,false,Boolean(dochange));
		else if(v==='' || v===null) clickradio(id, radios[id].indexOf(val(id,true)), true, Boolean(dochange));
	}
	else logerr('setradio('+id+') no such id',errok);
}


// MENU

menuopen='';
menus=[];
menuas=0;

// Draw Select Menu
function menu(id,v,script,list,att,disabled,draw) {
	if(!list && !att) {///temp patch state reporting
		///logit("menu("+id+") obsolete");
		var x=val(id,true,v);
		return (x==='0')? 0:x;
	}
	if(!att) att={};
	else if(typeof(att)!='object') logerr("menu("+id+") att should be object");
	// list
	menus[id]=list;
	// label
	var labelstyle='menulabel';
	var label='', valok=false, other=0, z=list.length;
	for(var i=0; i<z; i++) {
		if(!list[i]) continue;
		if(list[i][0]==' other ')
			other++;  // 1=keep other as textbox, 2=append other to menu
		else if(list[i][0]===v) {
			valok=true;
			if(!list[i][2]) label=String(list[i][1]);
		}
	}
	if(!label && other) {
		label=String(v);
		if(other==1) labelstyle='hide';
	}
	if(!valok && !other) {
		if(v) logit("menu "+id+" no value: "+v);
		v=(att.selectany)? list[0][0] : '';
		label=(att.selectany)? String(list[0][1]) : '';
	}
	var placestyle=(label=='')? 'placeholder':'hide';
	if(label=='') label='&nbsp;';  /// safari bug causes weird spacing if empty
	else {
		var c=label.indexOf("\t",1);
		if(c>0) label=label.substr(0,c);
		if(att.bold) labelstyle='"menulabel bold"';
	}
	// width
	var w1,w2,width1,d=19;
	if(!att.width) {
		if(!att.placeholder) w1=31;
	}
	else if(typeof(att.width)=='number') w1=w2=att.width;
	else {
		var it=att.width.split('-');
		w1=it[0], w2=it[1];
	}
	if(!w1 || w1=='100%') width1='';
	else if(w2==w1) width1="width:"+(w1-d)+"px";
	else if(!w2) width1="min-width:"+(w1-d)+"px";
	else width1="min-width:"+(w1-d)+"px; max-width:"+(w2-d)+"px;";
	// html
	if(att.disabled) disabled=true;
	var html='<input type=hidden name='+id+' value="'+v+'"';
	if(att.bold) html+=' bold=1';
	if(disabled) html+=' menudisabled';  // 'disabled' prevents hidden input from being submitted
	else if(script) html+=' dochange="'+script+'"';
	if(att.scrolladjust) html+=' scrolladjust='+att.scrolladjust;
	html+='>'+
	'<div class=menuspace';
	if(att.width=='100%') html+=' style="width:100%"';
	if(att.gap) html+=' style="margin-right:'+att.gap+'px"';
	if(att.tip) html+=' tip="'+att.tip+'"';
	html+='>\n'+
	'	<div id='+id+'_closed class=menuclosed';
	if(disabled) html+=' style="background-color:#f0f0f0"';
	html+='>\n'+
	'		<div click="popmenu(\''+id+'\')"';
	if(att.html) html+=' '+att.html;
	html+='>\n';
	if(att.placeholder) html+=
	'			<div id=ph_'+id+' class='+placestyle+'>'+att.placeholder+'</div>\n';
	html+=
	'			<svg width=17 height=16 class=menutriangle><polygon points="5,6 13,6 9,11" class=widgetfill></svg>\n'+
	'			<div id='+id+'_label class='+labelstyle+' style="'+width1+'">'+label+'</div>\n';
	if(other) {
		html+=
	'			<div id=text_'+id+' contenteditable class='+(labelstyle=='hide'?'textmenu':'hide')+' style="'+width1+'"';
		if(script) html+=' dochange="'+script+'"';
		if(att.limit) html+=' limit='+att.limit;
		if(att.type) {  // number,date,time,email,emaillist,url
			html+=' type='+att.type;
			if(att.numberformat) html+=' numberformat="'+att.numberformat+'"';
			if(att.decimals) html+=' decimals='+att.decimals;
			if('min' in att) html+=' min="'+att.min+'"';
			if('max' in att) html+=' max="'+att.max+'"';
			if(att.roundmin) html+=' roundmin='+att.roundmin;
		}
		else  // text
			if(att.caps) html+=' caps='+att.caps;
		if(att.type || 'spellcheck' in att)
			html+=' spellcheck=false autocapitalize=none autocorrect=off autocomplete=off';
		html+=' stop>';
		if(labelstyle=='hide') html+=label;
		html+='</div>\n';
	}
	html+=
	'		</div>\n'+
	'	</div>\n'+
	'	<div id='+id+'_open class=menuopenspace';
	if(w1=='100%') html+=' style="width:100%"';
	html+='></div>\n'+
	'</div>';
	// output
	if(draw) {
		document.write(html);
		if(!width1 && placestyle=='placeholder' && w1!='100%')
			el(id+'_label').style.minWidth=(el('ph_'+id).offsetWidth)+'px';
	}
	else return html;
}

// Draw Action Menu
function menua(func,list,lit,att,draw) {
	if(!att) att={};
	else if(typeof(att)!='object') logerr("menua() att should be object");
	menuas++;
	var html=
	'<div class=menuaspace';
	if(att.tip) html+=' tip="'+att.tip+'"';
	var style=(att.width)? "style='max-width:"+att.width+"px'" : '';
	html+='>\n'+
	'	<div id=menua'+menuas+'_btn class='+(att.dark?'menuabtndark':'menuabtn')+' click="popmenu(\'menua'+menuas+'\')"';
	if(att.html) html+=' '+att.html;
	html+='>\n'+
	'		<svg width=16 height=16><polygon points="4,6 12,6 8,11" stroke-width=0 class='+(att.dark?'btnfill':'widgetfill')+'></svg>\n'+
	'	</div>\n'+
	'	<div id=menua'+menuas+'_list class=menualistspace';
	if(att.align!='left') html+=
	' style="right:0px"';
	html+='>\n'+
	'		<div class=menualist click="clickmenua(\'menua'+menuas+'\',\''+func+'\')" '+style+' stop>\n';
	var z=list.length, v, l, att;
	for(var i=0; i<z; i++) {
		if(list[i]===null) att='menugap', l='';  // gap
		else {
			v=list[i][0], l=list[i][1];
			if(v===null) att='menuun';  // unselectable label
			else if(v===false) att='menudim';  // dim
			else if(v===lit) att='menulit';  // selected
			else att='menurow val="'+v+'"';  // normal
			if(l=='') l='&nbsp;';  /// safari bug causes weird spacing if empty
		}
		html+='\t\t\t<div class='+att+'>'+l+'</div>\n';
	}
	html+=
	'		</div>\n'+
	'	</div>\n'+
	'</div>';
	if(draw) document.write(html);
	else return html;
}

// Open/Close menu
function popmenu(id,blur) {
	if(id==self.closedmenu && !menuopen) return;  // menu already closed by mousedown
	menuopen=(id==menuopen)? '':id;
	menukeyindex=[];
	menukeystring='';
	menukeylit=null;
	menukeylast=0;
	// action menu
	if(id.substr(0,5)=='menua') {
		el(id+'_list').style.display=(menuopen)? 'block':'none';
		if(menuopen) {
			var o=el(id+'_list').children[0].children;
			for(var i=0; i<o.length; i++) {
				if(o[i].className=='menurow') menukeyindex[i]=o[i].innerHTML.toUpperCase();
			}
		}
	}
	// close select menu
	else if(!menuopen) {
		el(id+'_closed').style.visibility='visible';
		el(id+'_open').style.display='none';
		el(id+'_open').innerHTML='';
		if(inp(id).getAttribute('scrolladjust')=='page') mainpageo.style.height=null;
		if(blur) setTimeout(function() {blurall();},100);  // ios may pass click thru to 'other' text without firing mousedown or focus events; delay required
	}
	// open select menu
	else {
		var s=el(id+'_label').style;
		var width1=s.width || s.minWidth;
		var disabled=inp(id).hasAttribute('menudisabled');
		var val1=val(id,true);
		val1=val1.replace(/"/g,'&quot;');
		var placeholder=gethtml('ph_'+id,'errok');
		var listhtml='', label='', z=menus[id].length, it, v, l, blank, att, selected=false, indent, anylit=false, other=0;
		for(var i=0; i<z; i++) {
			if(menus[id][i]===null) continue;
			v=menus[id][i][0];
			if(String(v)!=val1 || v===null || v===false) continue;
			selected=true;
			break;
		}
		for(var i=0; i<z; i++) {
			it=menus[id][i];
			if(it===null) att='menugap', l='';  // gap
			else {
				v=it[0], l=it[1], blank=it[2];
				l=(l===undefined)? '':l+'';
				if(l.charAt(0)=="\t") {
					indent=true;
					l=l.substr(1);
				}
				else indent=false;
				if(v==' other ') other++;  // 1=keep textbox, 2=insert in menu
				if(v==' other ' && !l) {  // insert other
					if(selected || val1=='') continue;
					att='menulit val=" "', l=val1, label=val1;
				}
				else if(v===null) att='menuun';  // unselectable label
				else if(v===false) att='menudim';  // dim
				else if(String(v)==val1) {
					att='menulit val=" "', label=(blank)?'':l;  // selected
					if(!anylit) {
						att+=' id=menulit_'+id;  // scrolltoview
						anylit=true;  // first one only
					}
				}
				else if(disabled) att=(tip)? 'menuun val=" tip "' : 'menuun';  // disabled
				else {  // normal
					att='menurow val="'+v+'"';
					menukeyindex[i]=l.toUpperCase();
				}
				if(blank) att+=" blank=1";
				if(indent) l=l="&nbsp; &nbsp; \t"+l;
				if(l=='') l='&nbsp;';  /// safari bug causes weird spacing if empty
			}
			listhtml+='\t\t\t<div class='+att+'>'+l+'</div>\n';
		}
		if(label=='' && other==1) label=val1;
		if(label=='') label='&nbsp;';  /// safari bug causes weird spacing if empty
		else {
			placeholder='';
			var c=label.indexOf("\t",1);
			if(c>0) label=label.substr(0,c);
			if(inp(id).getAttribute('bold')) label='<b>'+label+'</b>';
		}
		var html=
		'		<div id=menuopenbox_'+id+' class=menuopenbox';
		if(disabled) html+=' style="background-color:#f0f0f0"';
		html+='>\n'+
		'			<div click="popmenu(\''+id+'\',1)" stop>\n';
		if(placeholder) html+=
		'				<div class=placeholder style="top:1px; left:1px;">'+placeholder+'</div>';
		html+=
		'				<svg width=17 height=16 class=menutriangle style="right:1px"><polygon points="5,6 13,6 9,11" class=widgetfill></svg>\n'+
		'				<div id='+id+'_label2 class=menulabel2 style="min-width:'+width1+'">'+label+'</div>\n'+
		'			</div>\n'+
		'			<div id=menulist_'+id+' class=menulist click="clickmenu(\''+id+'\')" stop>\n'+
		listhtml+
		'			</div>\n'+
		'		</div>\n';
		el(id+'_closed').style.visibility='hidden';
		var o=el(id+'_open');
		o.innerHTML=html;
		o.style.display='block';
		// scroll to show menu
		var scrolladjust=inp(id).getAttribute('scrolladjust');
		if(scrolladjust=='nav') {  // menu fixed in navbar, so make menu scrollable
			var winh=(touchos)? window.innerHeight : document.documentElement.clientHeight;
			var b=o.getBoundingClientRect().bottom-20;
			if(b>winh) {
				var h=o.offsetHeight-b+winh-37;
				el('menulist_'+id).style.height=h+'px';
				el('menuopenbox_'+id).style.borderRadius='4px 4px 0px 0px';
				if(anylit) {
					var bot=el('menulit_'+id).getBoundingClientRect().bottom;
					if(bot+40>winh) el('menulist_'+id).scrollTop=bot-winh+40;
				}
			}
		}
		else {
			if(scrolladjust=='page') {  // menu in page, so make page tall enough
				var y=o.getBoundingClientRect().bottom + window.pageYOffset;
				if(y>mainpageo.offsetHeight) mainpageo.style.height=y+'px';
			}
			scrolltoview(id+'_open', anylit?'menulit_'+id:'');
		}
	}
}

// Click Select Menu Item
function clickmenu(id) {
	if(!clickvalo) return;
	var v=clickval;  // space if already selected
	if(v==' tip ') return showtip();
	if(v!==' ' && val(id,true)!==String(v)) {  // menu changed
		if(v!=' other ') {
			setval(id,v);
			clicklabel=(clickvalo.hasAttribute('blank'))? '&nbsp;':clickvalo.innerHTML;
			if(clicklabel.substr(0,14)=='&nbsp; &nbsp; ') clicklabel=clicklabel.substr(14);
			var c=clicklabel.indexOf("\t",1);
			if(c>0) clicklabel=clicklabel.substr(0,c);
			sethtml(id+'_label',clicklabel);
			if(clicklabel=='&nbsp;') clicklabel='';
			setstyle('ph_'+id, (clicklabel=='')?'placeholder':'hide', 'errok');
		}
		else setval(id,'');
		eval(inp(id).getAttribute('dochange'));
		el(id+'_closed').classList.remove('required');
	}
	popmenu(id);
	if(v===' ') return;
	if(!el('text_'+id)) return;
	var other=(v==' other ');
	setstyle(id+'_label', other?'hide':'menulabel');
	setstyle('text_'+id, other?'textmenu':'hide');
	if(other) {
		settext(id,'');
		focus(id);
	}
}

// Click Action Menu Item
function clickmenua(id,func) {
	if(clickvalo) {
		clicklabel=clickvalo.innerHTML;
		if(func) eval(func+'("'+clickval+'")');
	}
	popmenu(id);
}

// Set Menu
function setmenu(id,v,errok) {
	if(!menus[id]) return logerr('setmenu('+id+','+v+') no such menu',errok);
	if(v===null || v===false) v='';
	else v=String(v);
	var label='', other=false, it;
	for(var i=0; i<menus[id].length; i++) {
		it=menus[id][i];
		if(it===null) continue;
		if(String(it[0])==v) {
			label=(it[2])? '&nbsp;':it[1];
			other=false;
			break;
		}
		if(it[0]==' other ') other=true;
	}
	if(label=='' && v!='') {  // not in menu
		if(other) label=v;
		else if(errok) v='';
		else return logerr('setmenu('+id+','+v+') no such item');
	}
	if(label=='') label='&nbsp;';
	else {
		var c=label.indexOf("\t",1);
		if(c>0) label=label.substr(0,c);
	}
	if(inp(id).getAttribute('bold') && label!='') label='<b>'+label+'</b>';
	setval(id,v);
	sethtml(id+'_label',label);
	setstyle('ph_'+id, (label=='&nbsp;')?'placeholder':'hide', 'errok');
	setstyle(id+'_label', 'menulabel');
	setstyle('text_'+id, 'hide', 'errok');
}



// DATE BOX CALENDAR

calopen='';

// onfocus: open calendar
function popcal(id,min,max,def) {
	if(calopen===id) return;  // already open
	if(calopen) {  // close other
		if(!mini) sethtml('cal_'+calopen,'');
		else el('calboxspace').outerHTML='';
	}
	calopen=id;
	calmin=min;
	calmax=max;
	caly=calm=cald=0;  // date lit
	var dt=new Date(); today=yyyymmdd(dt.getFullYear(),dt.getMonth()+1,dt.getDate());
	// parse date from textbox; same algorithm as do/saveass
	var x=val(calopen);
	var number='0123456789';
	if(!x) {}
	// parse 12/31
	else if(number.indexOf(x[0])>=0) {
		var pattern=(calmin)?
			/^(\d{1,2})\/(\d{1,2})/:  // parse mm/dd from mm/dd-dd
			/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/;  // parse mm/dd/yy
		var it=pattern.exec(x);
		if(it) {
			calm=it[1]-0;
			cald=it[2]-0;
			caly=it[3]-0;
			if(calm<1 || calm>12) caly=calm=cald=0;  // ignore if invalid month
		}
	}
	// parse Dec 31 [,2015]
	else if(calmin) {
		pattern=/[^,\/-]+/;  // parse Dec 30 from Dec 30-31 or Dec 30, 2009
		var it=pattern.exec(x);
		if(it) {
			dt=new Date(it+', '+calmin.substr(0,4));
			if(dt!='Invalid Date' && dt!='NaN') {
				calm=dt.getMonth()+1;
				cald=dt.getDate();
			}
		}
	}
	else {
		dt=new Date(x);
		if(dt!='Invalid Date' && dt!='NaN') {
			calm=dt.getMonth()+1;
			cald=dt.getDate();
			caly=dt.getFullYear();
		}
	}
	// infer year
	if(calm && calmin) {  // year is ambiguous only if range covers new year
		var md=(calm<10?'0'+calm:calm)+'-'+(cald<10?'0'+cald:cald);
		if(md>=calmin.substr(5,5)) caly=calmin.substr(0,4)-0;  // after start of range
		else {
			var calm0=calm-1;  // 1 month prior (dec=0)
			md=(calm0<10?'0'+calm0:calm0)+'-'+(cald<10?'0'+cald:cald);
			if(md<=calmax.substr(5,5)) caly=calmax.substr(0,4)-0;  // before end of range or 1 month after
			else caly=calmin.substr(0,4)-0;  // else use year of min date
		}
	}
	// clean year
	else if(calm && !calmin) {
		if(caly<60) caly+=2000;  // 2000-2059
		else if(caly<100) caly+=1900;  // 1960-1999
	}
	// if no date, default this month
	if(!caly) {
		if(calmin && today<calmin)  // first month if before date range
			var showy=calmin.substr(0,4)-0, showm=calmin.substr(5,2)-0;
		else if(calmax && today>calmax)  // last month if past date range
			var showy=calmax.substr(0,4)-0, showm=calmax.substr(5,2)-0;
		else if(def)  // default month
			var showy=def.substr(0,4)-0, showm=def.substr(5,2)-0;
		else  // this month
			var showy=today.substr(0,4)-0, showm=today.substr(5,2)-0;
	}
	else var showy=caly, showm=calm;  // selected month
	// draw
	el('cal_'+calopen).style.position='relative';
	drawcal(showy,showm);
}

function hidecal() {
	if(!calopen) return;
	if(!mini) sethtml('cal_'+calopen,'');
	else el('calboxspace').outerHTML='';
	calopen='';
}

function closecal() {  // mini click x to close cal; open keyboard to type
	var id=calopen;
	hidecal();
	ignorepopcal=true;
	focus(id);
}

function clickcal() {  // insert date and close calendar
	if(!clickval) return;
	settext(calopen,clickval);
	var o=el('text_'+calopen);
	if(!mini) blur(o);
	else {  // like blur event
		textfocus=false;
		hidecal();
		if(o.hasAttribute('doblur'))
			eval(o.getAttribute('doblur'));
	}
	var script=o.getAttribute('dochange');
	if(script) eval(script);
}

function drawcal(showy,showm) {
	var months=',January,February,March,April,May,June,July,August,September,October,November,December';
	var month=months.split(',')[showm];
	var day=24*60*60*1000;
	var dt=new Date(showy,showm-1,1,12,0,0);  // 1st of month, noon
	var mprev,mnext,yprev,ynext;
	mprev=showm-1; if(mprev==0) {mprev=12; yprev=showy-1;} else yprev=showy;
	mnext=showm+1; if(mnext==13) {mnext=1; ynext=showy+1;} else ynext=showy;
	// find Sunday before 1st
	var k=dt.getDay();  // 0-6 Sun-Sat
	dt.setTime(dt.getTime()-k*day);
	var y=dt.getFullYear();
	var m=dt.getMonth()+1;
	var d=dt.getDate();
	var att=(platform=='iOS' && !mini)? 'stop':'stop nodef';  // allow iPad to scroll on calendar; but Android Chrome doesn't need that
	var html=
"<div class=calbox click='clickcal()' "+att+">\n"+
"	<div class=callabel>"+month+" "+showy+"</div>\n"+
"	<div class=calprev click='drawcal("+yprev+","+mprev+")' "+att+"><svg width=20 height=20 style='display:block'><polygon points='13,4 5,10 13,16' class=calwidget /></svg></div>\n"+
"	<div class=calnext click='drawcal("+ynext+","+mnext+")' "+att+"><svg width=20 height=20 style='display:block'><polygon points='7,4 15,10 7,16' class=calwidget /></svg></div>\n";
	if(mini) html+=
"	<div class=calx click='closecal()' "+att+"><svg width=20 height=20 style='display:block'><g class=calwidget stroke-width=2><line x1=5 y1=5 x2=15 y2=15 /><line x1=5 y1=15 x2=15 y2=5 /></svg></div>\n";
	html+=
"	<div class=calhead><b>S</b></div><div class=calhead><b>M</b></div><div class=calhead><b>T</b></div><div class=calhead><b>W</b></div><div class=calhead><b>T</b></div><div class=calhead><b>F</b></div><div class=calhead><b>S</b></div><br>\n";
	var e,w,ymd,val,style;
	for(e=1;e<=10;e++) {  // each week, with fail-safe
		html+=
"		";
		for(w=0;w<=6;w++) {  // each day column
			val=(calmin)? m+'/'+d : m+'/'+d+'/'+String(y).substr(2,2);
			ymd=yyyymmdd(y,m,d);
			if(y==caly && m==calm && d==cald) style='callit';
			else if(m!=showm || calmin && (ymd<calmin || ymd>calmax)) style='caldim';
			else if(ymd==today) style='caltoday';
			else style='caldate';
			html+="<div class="+style+" val='"+val+"'>"+d+"</div>";
			dt.setTime(dt.getTime()+day);  // increment one day
			y=dt.getFullYear();
			m=dt.getMonth()+1;
			d=dt.getDate();
		}  // next day
		html+="<br>\n";
		if(m!=showm) break;
	}  // next week
	html+=
"</div>";
	if(mini) {
		var o=el('calboxspace');
		if(o) o.innerHTML=html;
		else {
			mainpageo.insertAdjacentHTML('beforeend','<div id=calboxspace>'+html+'</div>');
			el('calboxspace').style.top=(80+window.pageYOffset)+'px';
		}
	}
	else sethtml('cal_'+calopen,html);
}

function yyyymmdd(y,m,d) {
	return y+'-'+(m<10?'0':'')+m+'-'+(d<10?'0':'')+d;
}


// REQUIRED INPUT

// highlight input yellow
function settextreq(id) {
	var o=el('text_'+id);
	if(o.className.indexOf('textboxp2')>=0) o=o.parentNode;
	o.classList.add('required');
}

function setmenureq(id) {
	el(id+'_closed').classList.add('required');
}

function setradioreq(id,x) {
	for(var i=radios[id].length-1; i>=1; i--) {
		el(id+'_'+i+'_circle').style.fill=(x || x===undefined)? 'hsl(60,100%,85%)':'white';
	}
}

function setcheckreq(id,x) {
	el(id+'_box').style.fill=(x || x===undefined)? 'hsl(60,100%,85%)':'white';
}


// STRINGS

// return true if needle is in haystack, case sensitive
function isin(needle,haystack) {
	if(typeof(haystack)=='number') haystack=haystack.toString();
	else if(typeof(haystack)!='string') return false;
	return (haystack.indexOf(needle)>=0);
}

// return true if needle is one of the comma-delim items in haystack, case sensitive
function isany(needle,haystack) {
	haystack=haystack.split(',');
	for(var k=0; k<haystack.length; k++)
		if(haystack[k]==needle) return true;
	return false;
}

// return true if strings a and b are same without html entities
function samehtml(a,b) {
	return (unhtml(a)==unhtml(b));
}

// replace string x with string y in string t
function repstr(x,y,t) {
	t=t+'';
	while(true) {
		var n=t.indexOf(x);
		if(n==-1) return t;
		t=t.substring(0,n)+y+t.substring(n+x.length,t.length);
	}
}

// in string x allow only characters in string f; replace any other chars with string r
function filter(x,f,r) {
	var y='';  // output
	if(r==null) r='';
	var z=x.length;
	for(var i=0; i<z; i++)
		y+=(f.indexOf(x[i])>=0)? x[i]:r;
	return y;
}

// convert to html entities
function html(x) {
	x=x+'';
	x=x.replace(/\n/g,'<br>');
	x=x.replace(/&amp;/g,'&');  // never encode &
	x=x.replace(/"/g,'&quot;');
	x=x.replace(/</g,'&lt;');
	x=x.replace(/>/g,'&gt;');
	return x;
}

// convert html entitities to plain
function unhtml(x) {
	x=x+'';
	x=x.replace(/<br>/g,"\n");
	x=x.replace(/&quot;/g,'"');
	x=x.replace(/&lt;/g,'<');
	x=x.replace(/&gt;/g,'>');
	x=x.replace(/&amp;/g,'&');
	x=x.replace(/&nbsp;/g,' ');
	x=x.replace(/&mdash;/g,'—');
	return x;
}

// convert < > to &lt; &gt; except for safe tags
function safetags(x) {
	x=x.replace(/</g,'&lt;');
	x=x.replace(/>/g,'&gt;');
	x=x.replace(/&lt;br&gt;/g,'<br>');
	x=x.replace(/&lt;b&gt;/g,'<b>');
	x=x.replace(/&lt;\/b&gt;/g,'</b>');
	x=x.replace(/&lt;i&gt;/g,'<i>');
	x=x.replace(/&lt;\/i&gt;/g,'</i>');
	return x;
}

// use only letters and numbers, all lowercase
function alphanum(x,underscore) {
	x=x.toLowerCase();
	return x.replace(/[^a-z0-9]/g, underscore?'_':'');
}

// like encodeURIComponent() but keeps accented chars readable
function esc(x) {
	if(!x) return '';
	x=x+'';
	x=x.replace(/%/g,'%25');
	x=x.replace(/&/g,'%26');
	x=x.replace(/=/g,'%3D');
	x=x.replace(/</g,'%3C');
	x=x.replace(/>/g,'%3E');
	x=x.replace(/;/g,'%3B');
	x=x.replace(/\+/g,'%2B');  // PHP converts + to space, so encode as hex
	x=x.replace(/\n/g,'%0A');
	x=x.replace(/\r/g,'%0D');
	return x;
}

function ymd(mdy) {  // convert m/d/y to yyyy-mm-dd
	if(!mdy) return '';
	var mdy=mdy.split('/');
	var m=mdy[0]-0;
	var d=mdy[1]-0;
	var y=mdy[2]-0;
	if(!m || !d || !y) return '';
	if(m<10) m='0'+m;
	if(d<10) d='0'+d;
	if(y<80) y+=2000;
	else if(y<100) y+=1900;
	return y+'-'+m+'-'+d;
}

function copytoclipboard(w) {  // w = text, or object to copy contents directly
	if(typeof(w)=='string') {
		var it=document.createElement('div');
		it.className='selectable';
		it.style.position='absolute';
		it.style.top='-9999px';
		it.innerHTML=w;
		document.body.appendChild(it);
	}
	else it=w;
	var range=document.createRange();
	range.selectNode(it);
	window.getSelection().removeAllRanges();
	window.getSelection().addRange(range);
	document.execCommand('copy');
	if(typeof(w)=='string')
		document.body.removeChild(it);
}


// NUMBERS

// round to d decimal places
function roundit(x,d) {
	if(x+''=='') return '';
	x=x-0;
	if(isNaN(x)) return '';
	if(!d) return Math.round(x+0.00001);
	var z='0000000000';
	var m=('1'+z.substr(0,d))-0;
	return Math.round(x*m+0.00001)/m;
}

// show d decimal places
function fixit(x,d,comma) {
	if(x+''=='') return '';
	x=x-0;
	if(x+''=='NaN') return '';
	if(!d) return Math.round(x+0.00001);
	var z='0000000000';
	var m=('1'+z.substr(0,d))-0;
	x=(Math.round(x*m+0.00001)/m)+'';
	if(x.indexOf('.')<0) x+='.';
	var it=x.split('.');
	if(it[1].length<d)
		x+=z.substr(0,d-it[1].length);
	return (comma)? number_format(x) : x;
}

// inserts thousands separator, d2 true to pad cents .00
function number_format(x,d2) {
	var neg=(x-0<0);
	var y=String(x);
	if(neg) y=y.substr(1);
	var wd=y.split('.'), w=wd[0], d=wd[1];
	if(d2) {
		d=(d==null)? '0.00' : fixit('0.'+d,2);
		d=d.substr(2);
	}
	if(w.length>=7) w=w.substr(0,w.length-6)+','+w.substr(w.length-6,3)+','+w.substr(w.length-3,3);
	else if(w.length>=4) w=w.substr(0,w.length-3)+','+w.substr(w.length-3,3);
	if(neg) w='-'+w;
	if(d!=null) w+='.'+d;
	return w;
}

// parse raw number
function parsenum(x,def) {  // def=0 or whatever, default ''
	x=String(x).replace(/[,%$~]/g,'');
	x=parseFloat(x);
	if(!isNaN(x)) return x;
	return (def===undefined)? '':def;
}



// PROMPT

// show or hide prompt name p
promptopen=0;  // name of prompt current only
defaultprompt=0;  // name of prompt to show when no other prompt open
// nohide = true to always show, false to toggle
// caseid = id of container div for accordion transition (optional)
// return true if prompt open, false if closed
function showprompt(p,textid,nohide,caseid,scroll) {
	if(p==promptopen && nohide) return setviz(promptopen,true);  // already open (might need to move floatbox)
	if(p==promptopen || !p) p=defaultprompt;  // close prompt or show default
	if(caseid) {
		if(p) accordioncase(caseid);
		else {
			accordioncase(caseid,true);
			if(promptopen)
				setTimeout(function() {setviz(promptopen,false); promptopen=0;}, 300);
			return;
		}
	}
	if(promptopen)  // close any other prompt already open
		setviz(promptopen,false);
	promptopen=p;
	if(p) {
		setviz(p,true,'',scroll);
		if(textid) focus(textid);
	}
	if(caseid) accordioncase();
	return promptopen;
}

// scroll window to show element
// input id string or object
// opt id2 to focus on object within object: ie, selected menu item within popup menu
function scrolltoview(id,id2,noanimate) {
	var scroll=window.pageYOffset;
	var winht=(touchos)? window.innerHeight : document.documentElement.clientHeight;
	if(id=='bottom') var o=mainpageo;
	else var o=(typeof(id)=='string')? el(id) : id;
	if(!o) return logerr("scrolltoview no id="+id);
	var o=o.getBoundingClientRect();
	var top=o.top;  // relative to viewport
	var bot=o.bottom;
	var oversized=(bot-top>winht-mainpagetop);
	var d=0;
	if(id=='bottom') {
		if(bot>winht) d=bot-winht;
	}
	else if(top<mainpagetop || oversized) {  // place at top if below or taller than window
		d=top-mainpagetop;
		if(oversized && id2) {  // scroll up further to id2 if needed
			o=(typeof(id2)=='string')? el(id2) : id2;
			bot=o.getBoundingClientRect().bottom;
			if(bot+d>winht) d=bot-winht+20;
		}
	}
	else if(bot>winht)  // scroll up if below and fits within window
		d=bot-winht+20;
	if(!d) return;
	if(noanimate)
		window.scrollTo(0,Math.max(0,scroll+d));
	else {
		scrollstart=scroll;
		scrolld=d;
		scrollstep=0;
		scrollcurve=[0,0.04,0.11,0.21,0.34,0.50,0.66,0.79,0.89,0.96,1];  // ease in-out
		if(self.scrolltimer) clearInterval(scrolltimer);
		scrolltimer=setInterval(function() {
			scrollstep++;
			window.scrollTo(0,scrollstart+d*scrollcurve[scrollstep]);
			if(scrollstep<10) return;
			clearInterval(scrolltimer);
			scrolltimer=0;
		},10);
	}
}

function gap(touchgap,mousegap) {
	if(touchgap===true)
		return (touch)? "<div style='height:10px'></div>\n" : "<br>\n";
	if(touch)
		var g=(touchgap===undefined)? 10:touchgap;  // 10px standard between checkboxes etc.
	else
		var g=(mousegap===undefined)? touchgap:mousegap;
	if(!g) return '';
	return "<div style='height:"+g+"px'></div>\n";
}


// FORM VALIDATION

// when checking form, show alert message m and optionaly focus on element
function err(id,m) {
	if(!m) m='';
	if(self.errtimer) clearTimeout(errtimer);  // if multiple called in one sequence, do only last one
	errtimer=setTimeout(function() {
		sethtml('alert',m,'errok');
		setviz('showalert',m!='','errok');
		if(m!='') scrolltoview('alert');
		if(!id) return;
		if(inp('text_'+id)) focusp(id);  // password
		else if(el('text_'+id,'errok')) focus(id);
		else if(menus[id]) popmenu(id);
	},20);  // sequence may include mousedown and mouseup, so wait for accordion animation
}


// TIP BOX

// Tip Box
tips=[];
tipbox=false;
if(!touchos) {
	tiptimer=false;
	tipwidth=0;
	tipheight=0;
	window.addEventListener('load',function() {
		tipbox=el('tipbox','errok');
	});
}

// display tooltip if mouse hover 1.5 seconds
function showtip(tip1) {
	if(touchos) return;
	if(tip1) tip=tip1;
	else if(!tip || !tipbox || tips[tip]==='') return;  // no tip for current element
	if(tip.substr(0,7)=='drawtip') eval(tip);
	tipopen=true;
	tipbox.innerHTML=tips[tip] || tip;
	tipbox.style.display='block';
	tipwidth=tipbox.offsetWidth;
	tipheight=tipbox.offsetHeight;
	tipbox.style.left= (Math.min(mousex+8,document.documentElement.clientWidth-tipwidth-8))+'px';
	tipbox.style.top= (mousey+tipheight+28<=document.documentElement.clientHeight)?
		(mousey+20)+'px':  // below mouse
		(mousey-tipheight-30)+'px';  // above mouse
	tipx=mousex+window.pageXOffset;
	tipy=mousey+window.pageYOffset;
}

// hide tooltip
function hidetip() {
	if(!tipbox) return;
	if(tiptimer) clearTimeout(tiptimer);
	tipbox.style.display='none';
	tipopen=tiptimer=false;
	tip='';
}


// LOGGING

logwin=null;  // null=not drawn yet; false=no logwin; object
logbuff='';  // temp until log drawn
logbr='';
logtimer=false;

window.addEventListener('load',function() {
	logwin=el('clientlog','errok') || false;
	if(logbuff && logwin) {
		logwin.insertAdjacentHTML('beforeend',logbuff);
		logwin.scrollTop=99999999;
	}
	logbuff='';
});

function logit(m,hot,html) {
	if(logwin===false) return;
	m=String(m);
	if(!html) {
		m=m.replace(/</g,'&lt;');
		m=m.replace(/>/g,'&gt;');
		m=m.replace(/\n/g,'<h3>\\n</h3>');
	}
	if(hot) m='<h2>'+m+'</h2>';
	if(logwin) {
		logwin.insertAdjacentHTML('beforeend',logbr+m+'\n');
		logwin.scrollTop=99999999;
	}
	else logbuff+=logbr+m+'\n';
	logbr='';
	if(logtimer) clearTimeout(logtimer);
	logtimer=setTimeout(function() {logbr='<p></p>'},500);
}

function logerr(m,errok,jserr) {
	if(errok) return;
	if(!self.errcount) errcount=0;
	errcount++;
	if(logwin && !isviz('clientlog')) showjuplog(0,1);
	logit(m,true);
	if(self.mini && self.logging) alert(m);
	if(watchjs && !jserr) {  // only on screens where it should report to bug log
		if(jslog) jslog+='<br>';
		jslog+=m;
		if(document.form1) postval('jserror',jslog);
	}
}

function hotlogit(m) {
	logit(m,true);
}

function loghtml(m) {
	m=String(m).replace(/&/g,'&amp;');
	logit(m);
}

function logvar(o,k,nest) {
	if(!nest) varout='';
	if(!k) k='';
	var type=typeof(o);
	if(o===true || o===false || o===null || o===undefined || type=='number' && isNaN(o))
		varout+=k+'=<h3><i>'+o+'</i></h3>';
	else if(type=='string') {
		o=o.replace(/&/g,'&amp;');  // show &quot; not "
		o=o.replace(/</g,'&lt;');
		o=o.replace(/>/g,'&gt;');
		o=o.replace(/\n/g,'<h3>\\n</h3>');
		o=o.replace(/\t/g,'<h3>\\t</h3>');
		if(o=='') varout+=k+'=<h3><i>empty</i></h3>';
		else varout+=k+'=<h3>&quot;</h3>'+o+'<h3>&quot;</h3>';
	}
	else if(type=='number')
		varout+=k+'='+o;
	else if(Object.prototype.toString.call(o)=='[object Array]') {  // array
		var ok=false;
		for(var l in o) {
			ok=true;
			logvar(o[l],k+'['+l+']',true);
		}
		if(!ok) varout+=k+'=<h3>[ ]</h3>';
	}
	else if(type=='function') varout+=k+'=<h3><i>function</i></h3>';
	else if(type=='object' && !o.nodeType) varout+=k+'=<h3><i>object</i></h3>';
	else if(type=='object' && o.nodeType==1) varout+=k+'=<h3><i>node</i></h3> &lt;'+o.nodeName.toLowerCase()+(o.id?' id='+o.id:'')+'&gt;';
	else if(type=='object' && o.nodeType!=3) varout+=k+'=<h3><i>node</i></h3> &lt;'+o.nodeName.toLowerCase()+(o.id?' id='+o.id:'')+'&gt; <h3>type='+o.nodeType+'</h3>';
	else if(type=='object' && o.length==0) varout+=k+'=<h3><i>node empty text</i></h3>';
	else if(type=='object') varout+=k+'=<h3><i>node</i> "</h3>'+o.nodeValue+'<h3>"</h3>';
	else varout+=k+'≈'+o;  // fail-safe
	if(nest) {
		varout+='\n';
		return;
	}
	logit(varout,false,true);
	varout='';
}

function logassoc(o) {  // associative array
	var varout='';
	for(var k in o)
		varout+=k+'='+typeof(o[k])+'\n';  // doesn't look pretty but it works
	logerr(varout);
}

function logascii(x) {
	var out='';
	for(var i=0; i<x.length; i++)
		out+=x[i]+'<h3>'+x.charCodeAt(i)+'</h3> ';
	logit(out,false,true);
}

function logcon(x) {
	console.log(x);
}

// log javascript errors
watchjs=false;
jslog='';
window.onerror=logjserror;  // uncaught
function logjserror(errmsg,page,line,col,erro) {
	jsscan();
	if(errmsg=="Script error." || errmsg.substr(0,16)=="Access is denied") return;
	if(errmsg.indexOf("ResizeObserver loop")>=0) return;  // common firefox errors 10/2020
	///if(errmsg.indexOf(".data.indexOf")>=0 || errmsg.indexOf("extAbbr")>=0 || errmsg.indexOf("elt.parentNode")>=0) return;  // common chrome plugin errors
	if(line || page) {
		if(page.indexOf('jupitered.com/')>=0 || page.indexOf('/localhost/')>=0) {
			page=page.split('/');
			page=page[page.length-1];
			page=page.split('?')[0];
			if(line<=1 && (!page || page.substr(-4)=='.php')) return;  // ignore inserted scripts
		}
		errmsg+=' (line '+line+' '+page+')';
	}
	logerr(errmsg,'',true);
	if(watchjs) {  // only on screens where it should report to bug log
		if(jslog) jslog+='<br>';
		jslog+=errmsg;
		if(document.form1) postval('jserror',jslog);
	}
	return true;
}

function jsscan() {
	if(self.jsscripts===undefined) {
		jsscripts='', jsplugins=false;
		for(var k=0; k<document.scripts.length; k++) {
			var src=document.scripts[k].src;
			if(!src || location.protocol!='https:') continue;
			var host=src.split('/')[2];
			if(host=='login.jupitered.com') continue;
			jsscripts+='<br>'+src;
			if(host=='www.dropbox.com' || host=='js.stripe.com' || host=='cdnjs.cloudflare.com' || host=='apis.google.com') continue;
			jsscripts+=' !!';
			if(!jsplugins) jsplugins=[];
			jsplugins[host]=true;
		}
		for(k=0; k<navigator.plugins.length; k++) {
			var it=navigator.plugins[k].name;
			if(it=='WebKit built-in PDF' || it=='Chrome PDF Plugin' || it=='Chrome PDF Viewer' || it=='Native Client' || it=='Edge PDF Viewer' || it=='Office Editing for Docs, Sheets & Slides' || it=='Shockwave Flash') continue;
			jsscripts+='<br>plugin: '+it;
			///if(!jsplugins) jsplugins=[];
			///jsplugins[it]=true;
		}
		if(jsscripts) postval('jsscripts',jsscripts);
	}
	return jsplugins;  // alert disable plugins
}

// clientonly=2 if doubleclick, true if shift/opt ⌘
// showlog set on page open: 2=both, 1=client, 0=none; null if click/⌘ to toggle
function showjuplog(clientonly,showlog) {
	if(showlog===undefined) {  // toggle
		if(isviz('clientlog') && clientonly!=2) showlog=0;
		else if(clientonly) showlog=1;
		else showlog=2;
		savecookie('showlog',showlog,0);
	}
	// server + client logs
	if(showlog==2) {
		var winw=(touchos)? window.innerWidth : document.documentElement.clientWidth;
		var winh=(touchos)? window.innerHeight : document.documentElement.clientHeight;
		serverlog.style.height=(mini?'50%':(winh-340)+'px');
		clientlog.style.height=(mini?'50%':(winh-340)+'px');
		serverlog.style.width=(mini?'50%':(winw-280)+'px');
		clientlog.style.width=(mini?'50%':'280px');
		setviz('serverlog',1);
		setviz('clientlog',1);
		setstyle('juplog','jupbtnlit','errok');
	}
	// client log
	else if(showlog==1) {
		clientlog.style.height=(mini?'50%':'240px');
		clientlog.style.width=(mini?'100%':'280px');
		setviz('clientlog',1);
		setviz('serverlog',0);
		setstyle('juplog','jupbtnlit','errok');
	}
	// hide
	else {
		setviz('serverlog',0);
		setviz('clientlog',0);
		setstyle('juplog','jupbtn','errok');
	}
}



// COOKIES & LOCAL STORAGE

// save cookie
// expire = 0 to expire after browser session, blank to expire in one year, or number of seconds; compare to 1.php
function savecookie(name,value,expire) {
	var path='/';
	if(document.domain.indexOf('jupitered.com')!=-1) path+='; domain=jupitered.com';
	if(value==='')
		document.cookie=name+'=; path='+path+'; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
	else if(expire+''=='0')
		document.cookie=name+'='+encodeURIComponent(value)+'; path='+path;
	else {
		if(!expire) expire=365*24*60*60;  // one year
		e=new Date();
		e.setTime(e.getTime()+(expire*1000));
		document.cookie=name+'='+encodeURIComponent(value)+'; expires='+e.toGMTString()+'; path='+path;
	}
	if(name!='showlog') logit('save cookie '+name+'='+value+', path='+path);
}

function cookie(cookie) {
	var it='; '+document.cookie+';';
	var x=it.indexOf('; '+cookie+'=');
	if(x==-1) return '';
	x+=cookie.length+3;
	var y=it.indexOf(';',x);
	return decodeURIComponent(it.substring(x,y));
}

function savelocal(key,data1) {  // leave data1 null to save global data var; data1='' to delete
	if(data1!=null) data=data1;
	try {
		if(data=='') {
			localStorage.removeItem(key);
			logit('delete local '+key);
		}
		else {
			localStorage.setItem(key,data);
			logit('save local '+key+'='+data);
		}
		return true;
	}
	catch(e) {
		logit('savelocal('+key+') failed: '+e,1);
	}
}

function getlocal(key) {
	try {
		return localStorage.getItem(key);
	}
	catch(e) {
		logerr('getlocal('+key+') failed: '+e);
	}
}

function deletelocal(prefix) {  // delete multiple; omit prefix to delete all
	try {
		for(var key in localStorage) {
			if(prefix && key.substr(0,prefix.length)!=prefix) continue;
			localStorage.removeItem(key);
			logit('delete local '+key);
		}
	}
	catch(e) {
		logerr('deletelocal('+prefix+') failed: '+e);
	}
}


// RECOVER LOCAL STORAGE

if(getlocal('podr')) window.addEventListener('load',recoverpodr);  // wait for hidden input name=from

function recoverpodr() {
	var args=getlocal('podr');
	if(!args || val('from','errok')=='pod') return;
	var token=args.split('token=')[1];
	token=token.split('&')[0];
	var data='', i, r, token, it;
	for(var key in localStorage) {
		if(key.substr(0,5)!='podr_') continue;
		i=key.substr(5);
		it=getlocal(key);
		it=it.split("\n");
		if(it[0]!=token) {
			logerr(key+' invalid token='+it[0]);
			continue;
		}
		else if(it[2]!='end') {
			logerr(key+' truncated');
			continue;
		}
		r=encodeURIComponent(it[1]);
		data+=i+'\t'+r+'\t | \t';
	}
	if(!data)  // clear local
		return deletelocal('podr');
	data+='end=ok';
	logit('recover local podr');
	var http=new XMLHttpRequest();
	http.open('POST', '../0/ajax.php?do=savepodresponses', true);
	http.setRequestHeader('Content-type','application/x-www-form-urlencoded');
	http.onload=function() {
		if(http.status!=200) return;
		if(http.responseText!='ok') {
			if(http.responseText) logerr('failed!\n'+http.responseText);
			else logerr('failed! podr data:\n'+data); ///BUG-TRAP 11/27/20 something weird is creating podr localstorage during textwrite?
			return;
		}
		logit('ok');
		deletelocal('podr');
	};
	http.send(args+'&data='+data);
}
