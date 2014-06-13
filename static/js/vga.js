/****************************************************************************
#
# This file is part of the Vilfredo Client.
#
# Copyright © 2009-2014 Pietro Speroni di Fenizio / Derek Paterson.
#
# VilfredoReloadedCore is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation version 3 of the License.
#
# VilfredoReloadedCore is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
# FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License
# for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with VilfredoReloadedCore.  If not, see <http://www.gnu.org/licenses/>.
#
****************************************************************************/
var question_id = getQuerySegment('question');
if (!question_id) { 
    question_id = getQuerySegment('domination');
}
console.log(question_id);

var generation_id = getQuerySegment('gen');

var room = getQuerySegment('room');
console.log(room);

//var room = $.url().param('room') ? $.url().param('room') : '';
//var room = getQuerySegment('room');

var currentUserViewModel;
var proposalsViewModel;
var questionViewModel;
var viewProposalViewModel;
var loginViewModel;
var addProposalViewModel;
var newQuestionViewModel;
var svggraph;
var userid = false;
var votesgraph;
var pfvotesgraph;
var triangle;

function getKeys(object)
{
    //return ["5", "6", "7", "8"];
    var keys = [];
    map = object;
    if (map === undefined) return;
    $.each(map, function( index, value ) {
        keys.push(index);
    });
    return keys;
}

function arrayDiff(arr1, arr2)
{
    diff = [];
    jQuery.grep(arr2, function(el) {
        if (jQuery.inArray(el, arr1) == -1) 
        {
            diff.push(el);
        }
    });
    return diff;
}

function getQuerySegment(variable)
{
    //var params = $.url('0.0.0.0:8080/room/vilfredo/question/2').segment();
	var params = $.url().segment();
	var match = params.indexOf(variable);
	//console.log('getQueryVariable: match index = ' + match);
	if (match > -1 && typeof params[match+1] != "undefined")
	{
		return params[match+1]
	}
	else
	{
		return false;
	}
}
function getQueryVariable(variable)
{
    //var params = $.url('0.0.0.0:8080/room/vilfredo/question/2').segment();
	return $.url().param(variable);
}


function plotThresholdEndpoint(Ax, Ay, Bx, By, Ty) {
    return (Ty - (Ay - (Ax * (By - Ay) ) / (Bx - Ax))) / ((By - Ay) / (Bx - Ax));
}

function getNumericStyleProperty(style, prop){
    return parseInt(style.getPropertyValue(prop),10) ;
}

function element_position(e) {
    var x = 0, y = 0;
    var inner = true ;
    do {
        x += e.offsetLeft;
        y += e.offsetTop;
        var style = getComputedStyle(e,null) ;
        var borderTop = getNumericStyleProperty(style,"border-top-width") ;
        var borderLeft = getNumericStyleProperty(style,"border-left-width") ;
        y += borderTop ;
        x += borderLeft ;
        if (inner){
          var paddingTop = getNumericStyleProperty(style,"padding-top") ;
          var paddingLeft = getNumericStyleProperty(style,"padding-left") ;
          y += paddingTop ;
          x += paddingLeft ;
        }
        inner = false ;
    } while (e = e.offsetParent);
    return { x: x, y: y };
}

// Get point in global SVG space
function cursorPoint(svg, evt){
  var pt = svg.createSVGPoint();
  pt.x = evt.clientX; pt.y = evt.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}
function initCVTriangle_v2(svg)
{
	$('#votenowwindow .showtriangle .votenow').on( "click", function(e) {
    	var loc = cursorPoint(svg, e);
        console.log(loc.x + ' , ' + loc.y);
    	//svg = $('#votenowwindow .showtriangle').svg('get');
    	//svg.circle(currentx, currenty, 12, {class: 'vote', fill: 'white', stroke: 'white', strokeWidth: 2, cursor:     'pointer'});
	});
}


function drawTriangle2(svg, width, height)
{
	var path = svg.createPath();
    var triangle = svg.path(
        path.move( 100, 0)
        .line( -100, 200, true )
        .line( 200, 0, true )
        .close(),
        {
            fill: 'blue', 
            stroke: 'white', 
            strokeWidth: 2
        }
    );
}

function initCVTriangleLarge_v2(svg)
{
    var c = document.getElementsByClassName('pointer');
    var cx = c.cx.baseVal;
    var cy = c.cy.baseVal;
    var svg = this;
    var point = svg.createSVGPoint();
    svg.onmousemove = function(e){
        point.x = e.clientX;
        point.y = e.clientY;
        var ctm = c.getScreenCTM();
        var inverse = ctm.inverse();
        var p = point.matrixTransform(inverse);
        cx.value = p.x;
        cy.value = p.y;
    };
}



function resetSize(svg, width, height) 
{
	svg.configure({width: width, height: height}, true);
}

// Add current votes to votemap
function setVote(proposal)
{
    console.log('setVote called...');
	var votemap = $('#modalvotesmap');
	var svg = $(votemap).svg('get');
	
	max_x = $(svg._container).innerWidth();
	console.log('container_width = ' + max_x);
    max_y = 0.7 * container_width;
    console.log('container_height = ' + max_y);

	cx = max_x * proposal.mapx;
	cy = max_y * proposal.mapy;
	
	var votesgroup = $('.votes', svg.root());
    var radius = 10;
	
	// If a vote is already plotted, remove it
	var vote = $('.vote', svg.root()).filter(function() {
		return $(this).data("pid") == proposal.id();
	});
	if (vote)
	{
		$(vote).remove();
	}
	
	// Set color based on endorse_type
	switch(proposal.endorse_type())
    {
    case 'endorse':
        fill_color = 'green';
        break;
    case 'oppose':
        fill_color = 'red';
        break;
    case 'confused':
        fill_color = 'blue';
        break;
    default:
        fill_color = 'yellow';
    }
	
	// Plot vote on votemap
	vote = svg.circle(votesgroup, cx, cy, radius+1, {class: 'vote', fill: fill_color, cursor: 'pointer'});
    $(vote).data('pid', proposal.id());
    $(vote).on( "mouseenter", function(e) {
        //console.log("Proposal " + $(this).data('pid'));
        console.log("Proposal cx " + $(this).attr('cx') + ", cy " + $(this).attr('cy'));
        //$('#votemap-thisprop').html($(this).data('pid'));
    });
}

function voteHandler(e)
{
    console.log('vote recorded by voteHandler function...');
	var posX = $('#map').offset().left;
	var cx = e.pageX - posX - radius;
    var posY = $(triangle).offset().top;
    var cy = e.pageY - posY - radius;
	//svg.circle(g, cx, cy, radius+1, {class: 'vote', fill: 'yellow', cursor: 'pointer'});
	// Endorse with normalised vote coordinates
	var n_cx = cx / max_x;
	var n_cy = cy / max_y;
	console.log("Vote to be added at " + cx + ", " + cy);
	//proposalsViewModel.mapEndorseWithIndex(n_cx, n_cy, voteMapViewModel.proposal_index);
}

function createVoteMap(svg)
{
	
	console.log('createVotesMap called...');
	
	container_width = $(svg._container).innerWidth();
	console.log('container_width = ' + container_width);
    container_height = 0.7 * container_width;
    console.log('container_height = ' + container_height);
    
    
    /*
    //var viewport_height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    var window_height = $(window).height();
    console.log('Setting votemapwindow to window height ' + window_height);
    $('#votemapwindow .modal-dialog').css('height', 800);
    
    var container_height = $(svg._container).innerHeight();
    console.log('container_height = ' + container_height);
	var container_width = container_height / 0.7;
	console.log('container_width = ' + container_width);
	*/
    
    var max_x = container_width;
    var max_y = container_height;
    var mid_x = container_width/2;
    var mid_y = container_height/2;
    
    resetSize(svg, container_width, container_height); 
    
	var path = svg.createPath();
    var triangle = svg.path(
        path.move(0, 0)
        .line( container_width/2, container_height, true )
        .line( container_width/2, -container_height, true )
        .close(),
        {
            fill: 'white',
            stroke: '#CDCDCD',
            strokeWidth: 2,
            id: 'map'
        }
    );

    var threshold_x = container_width*questionViewModel.mapx;
    var threshold_y = container_height*questionViewModel.mapy;
    // Add current threshold point - debugging
    
    //var threshold = svg.circle(container_width*questionViewModel.mapx, container_height*questionViewModel.mapy, 6, {class: 'threshold', fill: '#D1EEEE'});
    
    
    // Add threshold marker
    var marker_top = svg.line(threshold_x, 0, threshold_x, threshold_y, {id: 'marker_top', strokeWidth: 2, stroke: 'black'});
    
    var Lx = plotThresholdEndpoint(0, 0, mid_x, max_y, threshold_y);
    console.log("Left point at " + Lx + ", " + threshold_y);
    
    var Rx = plotThresholdEndpoint(max_x, 0, mid_x, max_y, threshold_y);
    console.log("Right point at " + Rx + ", " + threshold_y);
    // #CDCDCD
    var marker_left = svg.line(Lx, threshold_y, Rx, threshold_y, {id: 'marker_top', strokeWidth: 2, stroke: 'black'});

    /*
    var threshold = svg.circle(threshold_x, threshold_y, 6, {class: 'threshold', fill: '#D1EEEE'});
    $(threshold).on( "mouseenter", function(e) {
    	console.log("Threshold cx " + $(this).attr('cx') + ", cy " + $(this).attr('cy'));
    })
    .on( "mousemove", function(e) {
        $(this).parent().siblings('#map').trigger(e);
    });*/

    var g = svg.group({id : 'votes'});
    var radius = 10;
    
    var threshold_x = container_width*questionViewModel.mapx;
    var threshold_y = container_height*questionViewModel.mapy;
    console.log("Threshold at " + threshold_x + ", " + threshold_y);
    
    

    // Add current votes to votemap
    ko.utils.arrayForEach(proposalsViewModel.proposals(), function(proposal) {
        
        if (!proposal.mapx || !proposal.mapy)
        {
            return;
        }
        
        cx = container_width * proposal.mapx;
        cy = container_height * proposal.mapy;
        console.log("Draw vote at (" + cx + ", " + cy +")");
        
        if (proposal.id() == voteMapViewModel.proposal_id()) // here
        {
            console.log('VoteMap point is of type' + voteMapViewModel.endorse_type());
            switch(voteMapViewModel.endorse_type())
            {
            case 'endorse':
                fill_color = 'green';
                break;
            case 'oppose':
                fill_color = 'red';
                break;
            case 'confused':
                fill_color = 'blue';
                break;
            default:
                fill_color = 'yellow';
            }
        }
        else
        {
            fill_color = '#BEBEBE';
        }
        
        vote = svg.circle(g, cx, cy, radius+1, {class: 'vote', fill: fill_color, cursor: 'pointer'});
        $(vote).data('pid', proposal.id());
        /*
        $(vote).on( "mouseenter", function(e) {
            console.log("Proposal " + $(this).data('pid'));
            //$('#votemap-thisprop').html($(this).data('pid'));
        });
        */
        
        $(vote).on( "click", function(e) {
            console.log('click on vote');
            /*
            var evt = new jQuery.Event("click");
            evt.pageX = e.pageX;
            evt.pageY = e.pageY;
            */
            $(this).parent().siblings('#map').trigger(e);
        });
        $(vote).on( "mouseenter", function(e) {
            //console.log("Proposal " + $(this).data('pid'));
            console.log("Proposal cx " + $(this).attr('cx') + ", cy " + $(this).attr('cy'));
            //$('#votemap-thisprop').html($(this).data('pid'));
        });
        $(vote).on( "mousemove", function(e) {
            $(this).parent().siblings('#map').trigger(e);
        });
    });
    
    
    //$(triangle).bind( "click", voteHandler);
    
    $(triangle).on( "click", function(e) {
    	console.log('vote recorded...');
    	var posX = $(triangle).offset().left;
    	var cx = e.pageX - posX - radius;
    	//var cx = e.pageX - posX;
        var posY = $(triangle).offset().top;
        var cy = e.pageY - posY - radius;
        //var cy = e.pageY - posY;
    	//svg.circle(g, cx, cy, radius+1, {class: 'vote', fill: 'yellow', cursor: 'pointer'});
    	// Endorse with normalised vote coordinates
    	var n_cx = cx / max_x;
    	var n_cy = cy / max_y;
    	console.log("Vote to be added at " + cx + ", " + cy);
    	proposalsViewModel.mapEndorseWithIndex(n_cx, n_cy, voteMapViewModel.proposal_index());
	});
	
	$(triangle).on( "mousemove", function(e) {
    	var posX = $(triangle).offset().left;
    	var cx = e.pageX - posX - radius;
        var posY = $(triangle).offset().top;
        var cy = e.pageY - posY - radius;
        console.log("Mouse at " + cx + ", " + cy);
        // green #4A7023, red #CD2626, blue #009ACD
        
        /*
        if (cy > threshold_y)
        {
            //console.log("mouse y " + cy + " < threshold_y " + threshold_y);
            fillcolor = '#009ACD';
        }
        else if (cx < threshold_x)
        {
            //console.log("mouse x " + cx + " < threshold_x " + threshold_x);
            fillcolor = '#CD2626';
        }
        else
        {
            //console.log("mouse x " + cx + " < threshold_x " + threshold_x);
            fillcolor = '#4A7023';
        }       
    	$(this).css('fill', fillcolor);
    	*/
    	
	});
	
    /*
    var cursor = svg.circle(100, 50, radius, {class: 'cursor', fill: 'blue', cursor: 'pointer'});
    $(triangle).on( "mousemove", function(e) {
    	if ($(cursor).attr('fill') == 'blue') { $(cursor).attr('fill', 'white'); }
    	var posX = $(this).offset().left;
        var posY = $(this).offset().top;
    	$(cursor).attr('cx', e.pageX - posX - radius)
    	.attr('cy', e.pageY - posY - radius);
	});
	$(cursor).on( "mousemove", function(e) {
    	var posX = $(triangle).offset().left;
        var posY = $(triangle).offset().top;
    	$(this).attr('cx', e.pageX - posX - radius)
    	.attr('cy', e.pageY - posY - radius);
	});
	
	$(cursor).on( "click", function(e) {
    	console.log('mouse click...');
    	var posX = $(triangle).offset().left;
    	var cx = e.pageX - posX - radius;
        var posY = $(triangle).offset().top;
        var cy = e.pageY - posY - radius;
    	svg.circle(g, cx, cy, radius+1, {class: 'vote', fill: 'yellow', cursor: 'pointer'});
    	// Endorse with normalised vote coordinates
    	var n_cx = max_x / cx;
    	var n_cy = max_y / cy;
	});
	*/
}

function initCVTriangleLarge(jqsvg)
{
	width = $(jqsvg._container).innerWidth();
    height = $(jqsvg._container).innerHeight();
    //svg.configure({width: width, height: height}, true);
    panelwidth = $('#cvtriangle').innerWidth();
    panelheight = $('#cvtriangle').innerHeight();
	//svg.configure({width: panelwidth, height: panelheight}, true);

	//jqsvg = $('#cvtriangle').svg('get');
	var votemap = $('.votemap', jqsvg.root()).get(0);
	var pointer = $('.pointer', jqsvg.root()).get(0);

	$(pointer).on( "click", function(e) {
    	console.log('mouse click...');
    	//return;
    	//jqsvg = $('#cvtriangle').svg('get');
    	//svg = document.querySelector("svg");
    	svg = document.getElementsByTagName("svg")[1];
    	var pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        pt = pt.matrixTransform(svg.getScreenCTM().inverse());
        console.log('Draw point at pt.x ' + pt.x + ' , pt.y ' + pt.y);
        // Add vote to votes group
        var votes = $('.votes', jqsvg.root()).get(0);
    	jqsvg.circle(pt.x, pt.y, 5, {class: 'vote', fill: 'yellow', stroke: 'white', strokeWidth: 0, cursor: 'pointer'});
	});
	
	$(votemap).on( "mouseout", function(e) {
    	console.log('mouse out...');
    	return;
    	var jqsvg = $('#cvtriangle').svg('get');
    	var pointer = $('.pointer', jqsvg.root()).remove();
	});
	
	$(votemap).on( "mousemove", function(e) {
    	console.log('mouse move...');
    	//svg = document.querySelector("svg");
    	svg = document.getElementsByTagName("svg")[1];
    	var pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        pt = pt.matrixTransform(svg.getScreenCTM().inverse());
        console.log('Move point to pt.x ' + pt.x + ' , pt.y ' + pt.y);
    	
    	var pointer = $('.pointer', jqsvg.root()).get(0);
    	$(pointer).attr('fill', 'white');
	    var cx = pointer.cx.baseVal;
        var cy = pointer.cy.baseVal;
	    cx.value = Math.round(pt.x);
        cy.value = Math.round(pt.y);
	});
	$(pointer).on( "mousemove", function(e) {
    	console.log('mouse move...');
    	//svg = document.querySelector("svg");
    	svg = document.getElementsByTagName("svg")[1];
    	var pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        pt = pt.matrixTransform(svg.getScreenCTM().inverse());
        console.log('Move point to pt.x ' + pt.x + ' , pt.y ' + pt.y);
    	
    	var pointer = $('.pointer', jqsvg.root()).get(0);
    	$(pointer).attr('fill', 'white');
    	    var cx = pointer.cx.baseVal;
            var cy = pointer.cy.baseVal;
    	    cx.value = pt.x;
            cy.value = pt.y;
	});
}

function initCVTriangle(svg)
{
	$('#votenowwindow .showtriangle .votenow').on( "click", function(e) {
    	
    	var posX = $(this).offset().left;
        var posY = $(this).offset().top;
        
        console.log('posX ' + posX + ' , ' + 'posY ' + posY);
        console.log('e.pageX ' + e.pageX + ' , ' + 'e.pageY ' + e.pageY);
        
        panelwidth = $('.showtriangle').innerWidth();
        panelheight = $('.showtriangle').innerHeight();
        
        console.log('panelwidth ' + panelwidth + ' , ' + 'panelheight ' + panelheight);
        
    	console.log((e.pageX - posX) + ' , ' + (e.pageY - posY));
    	currentx = (e.pageX - posX);
        currenty = (e.pageY - posY);
        console.log(currentx + ' , ' + currenty);
    	svg = $('#votenowwindow .showtriangle').svg('get');
    	svg.circle(currentx, currenty, 5, {class: 'vote', fill: 'white', stroke: 'white', strokeWidth: 2, cursor: 'pointer'});

	});
}

showCVTriangle = function()
{
	$('#votenowwindow').modal('show');
	//$('.showtriangle').svg({onLoad: drawVotingTriangle});
	$('#votenowwindow .showtriangle').svg({loadURL: STATIC_FILES + '/images/voting_triangle.svg', onLoad: initCVTriangle});
}



var TimePeriod = function(label, seconds) {
    this.period = label;
    this.seconds = seconds;
};

function get_timestamp()
{
    return Math.floor(new Date().getTime() / 1000);
}

function arrayFirstIndexOf(array, predicate, predicateOwner) {
    for (var i = 0, j = array.length; i < j; i++) {
        if (predicate.call(predicateOwner, array[i])) {
            return i;
        }
    }
    return -1;
}

var alert_flash = {'success': 'Success!', 'danger': 'Error!', 'warning': 'Warning!', 'info': 'Note!'};

jQuery.fn.extend({
    removeAlertClass: function() {
        return this.each(function() {
            var canDismiss = $(this).hasClass('alert-dismissable');
            $(this).removeClass(function (index, css) {
                return (css.match (/\balert-\S+/g) || []).join(' ');
            });
            if (canDismiss)
            {
                $(this).addClass('alert-dismissable');
            }
        });
    },
    setAlertClass: function(alert) {
        return this.each(function() {
            $(this).removeAlertClass().addClass('alert-'+alert);
        });
    },
    setAlert: function(alert, text) {
        return this.each(function() {
            $(this).setAlertClass(alert)
            .find('.text')
                .html(text)
            .end()
            .find('.flash')
                .html(alert_flash[alert])
            .end()
            .fadeIn()
        });
    }
});

function add_page_alert(alert, text)
{
    var alertbox = '<div class="main alert alert-'+ alert +' alert-dismissable">';
	alertbox = alertbox + '	<span class="flash">' + alert_flash[alert] + '</span> <span class="text">';
	alertbox = alertbox + text + '</span>';
	alertbox = alertbox +  '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button></div>';
	
	$('.container.main').prepend(alertbox);
	$('.alert.main').fadeIn();
}

function time_dhm(timestamp)
{
    var days = Math.floor(timestamp / 86400);
    timestamp = timestamp - (days * 86400);
    var hours = Math.floor(timestamp / 3600) % 24;
    timestamp = timestamp - (hours * 3600);
    var minutes = Math.floor(timestamp / 60) % 60;
    return days + ' days ' + hours + ' hours and ' + minutes + ' minutes ';
}

function CurrentUserViewModel()
{
	var self = this;
	self.username = ko.observable('');
    self.password = '';
	self.userid = ko.observable(0);
	self.authToken = '';
	self.user = false
	self.remember = false;

	self.isLoggedIn = ko.computed(function() {
        console.log('isLoggedIn...' + this.userid());
		return this.userid() != 0;
    }, this);

	self.isLoggedOut = ko.computed(function() {
        console.log('isLoggedOut...' + this.userid());
		return this.userid() == 0;
    }, this);

	self.login = function(username, password, remember) {
		self.username(username);
		self.password = password;
		self.remember = remember;
		self.getAuthToken();
    }
	self.logout = function()
	{
		console.log("User logged out...");
		self.username("");
		self.password = "";
		self.authToken = '';
		self.user = false;
		self.userid(0);
		$.cookie('vgaclient', null, { path: '/' }); // fix
		proposalsViewModel.fetchProposals();
		resetGraphsAfterLogout();
	}
	self.beginLogin = function() {
        $('#login').modal('show');
    }
	self.loadUser = function()
	{
		// User already logged in
		if (this.userid() != 0)
		{
		    return;
		}
		if ($.cookie('vgaclient'))
		{
			self.authToken = $.cookie('vgaclient');
			return self.fetchCurrentUser();
		}
		else
		{
			return false;
		}
	}
	self.checkForToken = function()
	{
		if ($.cookie('vgaclient'))
		{
			self.authToken = $.cookie('vgaclient');
			return true;
		}
		else
		{
			return false;
		}
	}
	
	self.requestPasswordReset = function(email)
	{
		var URI = VILFREDO_API +'/request_password_reset';
		return ajaxRequest(URI, 'POST', {email: email}).done(function(data, textStatus, jqXHR) {
			loginViewModel().close();
			console.log('CurrentUserViewModel.requestPasswordReset');
			console.log(data);
		}).fail(function(jqXHR) {
           console.log('requestPasswordReset: There was an error. Status ' + jqXHR.status);
			$('#pwdreset .message .alert')
			.html(JSON.parse(jqXHR.responseText).message)
			.setAlertClass('danger')
			.fadeIn();
        });
	}
	
	self.getAuthToken = function()
	{
		var URI = VILFREDO_API +'/authtoken';
		$.cookie('vgaclient', null, { path: '/' });
		self.authToken = '';
		return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) {
		    self.authToken = data.token;
			loginViewModel().close();
			console.log('CurrentUserViewModel.getAuthToken:: Authtoken returned...');
			console.log(data);
			if (self.remember)
			{
				console.log('Remember login = ' + self.remember + ': Storing token in cookie');
				$.cookie('vgaclient', data.token, {expires: 3, path: '/'});
			}
			self.fetchCurrentUser();
		}).fail(function(jqXHR) {
           if (jqXHR.status == 403)
		    {
				$('#login .message').text('Sorry, your login details were not recognised.').fadeIn(500);
			}
        });
	}
	self.fetchCurrentUser = function()
	{
		//var URI = 'http://0.0.0.0:8080/api/v1/currentuser';
		var URI = VILFREDO_API + '/currentuser';
		return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) 
		{
		    console.log('Current user data returned...');
			console.log(data);
			self.userid(parseInt(data.user.id));
			console.log('fetchCurrentUser:: User ID set ==> ' + self.userid());
			self.user = data.user;
			self.username(data.user.username);
			if (proposalsViewModel)
			{
			    if (questionViewModel.phase() == 'writing')
			    {
			        proposalsViewModel.fetchProposals({user_only: true});
			    }
			    else
			    {
			        proposalsViewModel.fetchProposals();
			    }
			    resetGraphsForUser();
			}
		}).fail(function(jqXHR) {
           if (jqXHR.status == 401 || jqXHR.status == 403)
		   {
				console.log('Cookie token invalid or expired');
				$.cookie('vgaclient', null, { path: '/' });
				self.authToken = '';
		   }
        });
	}
}

/*
<option value="60">1  <?= $VGA_CONTENT['time_minute_txt'] ?></option>
<option value="120">2  <?= $VGA_CONTENT['time_minutes_txt'] ?></option>
<option value="300">5  <?= $VGA_CONTENT['time_minutes_txt'] ?></option>
<option value="3600">1 <?= $VGA_CONTENT['time_hour_txt'] ?></option>
<option value="7200">2 <?= $VGA_CONTENT['time_hours_txt'] ?></option>
<option value="10800">3 <?= $VGA_CONTENT['time_hours_txt'] ?></option>
<option value="21600">6 <?= $VGA_CONTENT['time_hours_txt'] ?></option>
<option value="43200">12 <?= $VGA_CONTENT['time_hours_txt'] ?></option>
<option value="64800">18 <?= $VGA_CONTENT['time_hours_txt'] ?></option>
<option value="86400" selected="yes" >1 <?= $VGA_CONTENT['time_day_txt'] ?></option>
<option value="172800">2 <?= $VGA_CONTENT['time_days_txt'] ?></option>
<option value="259200">3 <?= $VGA_CONTENT['time_days_txt'] ?></option>
<option value="302400"><?= $VGA_CONTENT['time_halfweek_txt'] ?></option>
<option value="345600">4 <?= $VGA_CONTENT['time_days_txt'] ?></option>
<option value="432000">5 <?= $VGA_CONTENT['time_days_txt'] ?></option>
<option value="518400">6 <?= $VGA_CONTENT['time_days_txt'] ?></option>
<option value="604800">1 <?= $VGA_CONTENT['time_week_txt'] ?></option>
<option value="864000">10 <?= $VGA_CONTENT['time_days_txt'] ?></option>
<option value="907200"><?= $VGA_CONTENT['time_weekandahalf_txt'] ?> </option>
<option value="1209600">2 <?= $VGA_CONTENT['time_weeks_txt'] ?></option>
<option value="1296000">15 <?= $VGA_CONTENT['time_days_txt'] ?></option>
<option value="1728000">20 <?= $VGA_CONTENT['time_days_txt'] ?></option>
<option value="1814400">3 <?= $VGA_CONTENT['time_weeks_txt'] ?></option>
<option value="2419200">4 <?= $VGA_CONTENT['time_weeks_txt'] ?></option>
<option value="2592000">30 <?= $VGA_CONTENT['time_days_txt'] ?> / 1 month</option>
<option value="2678400">31 <?= $VGA_CONTENT['time_days_txt'] ?></option>
*/

function NewQuestionViewModel() 
{
    var self = this;
    self.title = ko.observable('').extend({ required: true, maxLength: 100, minLength:2 });
    self.blurb = ko.observable('').extend({ required: true, maxLength: 1000, minLength:10 });

    self.availableTimePeriods = ko.observableArray([
       new TimePeriod("1 second", 1),
       new TimePeriod("1 minute", 60),
       new TimePeriod("1 hour", 3600),
       new TimePeriod("1 day", 86400),
       new TimePeriod("1 week", 604800),
       new TimePeriod("30 days", 2592000)
    ]);
    
    self.minimum_time = ko.observable(self.availableTimePeriods()[2]);
    self.maximum_time = ko.observable(self.availableTimePeriods()[3]);
    
    self.resetform = function()
    {
		console.log("NewQuestionViewModel.resetform() called ...");
        self.title('');
        self.blurb('');
        self.title.isModified(false);
        self.blurb.isModified(false);
        self.minimum_time({});
        self.maximum_time({});
        $('#addquestion .alert').css('display', 'none').html('');
    }
    self.close = function()
    {
        console.log("NewQuestionViewModel.close() called ...");
        self.resetform();
        $('#addquestion').modal('hide');
    }
    self.add = function()
	{
		console.log("NewQuestionViewModel.add() called ...");
		
		questionsViewModel.addQuestion({
            title: self.title(),
            blurb: self.blurb(),
            minimum_time: self.minimum_time().seconds,
            maximum_time: self.maximum_time().seconds
        });
	}
}

function RegisterViewModel()
{
    var self = this;
    self.username = ko.observable('').extend({ required: true, maxLength: 50, minLength:2 });
    self.password = ko.observable('').extend({ required: true, maxLength: 60, minLength:6 });
    self.email = ko.observable('').extend({ required: true, maxLength: 50, minLength:2, email: true });
    
    self.reset = function()
    {
		self.username('');
        self.password('');
        self.email('');
        $('#register .alert').css('display', 'none').html('');
        self.username.isModified(false);
        self.password.isModified(false);
        self.email.isModified(false);
    }
    self.close = function()
    {
        self.reset();
        $('#register').modal('hide');
    }
    
    self.doregister = function()
    {
        self.reset();
        $('#register').modal('show');
    }
    
    self.register = function() {
		$('#register .message').text('').fadeOut(100);
		if (self.username() == '' || self.password() == '' || self.password() == '')
		{
			$('#register .message').text('You have not completed all the required fields.')
			.addClass('alert-danger')
			.fadeIn(500);
			return;
		}
        var new_user = {username: self.username(), password: self.password(), email: self.email()};
        ajaxRequest(VILFREDO_API + '/users', 'POST', new_user).done(function(data, textStatus, jqXHR) 
		{
		    console.log('toggleCommentSupport data returned...');
			console.log(data);
			
			if (jqXHR.status == 201)
			{
				console.log(data.message);
				registerViewModel().close();
				add_page_alert('success', 'Congratulations, you just registered with Vilfredo! You can now log in using your password.');				
			}
			else 
			{
				console.log("RegisterViewModel.register failed with status " + jqXHR.status);
				$('#register .alert')
				.html(data.message)
				.setAlertClass('danger')
				.fadeIn();
			}
		}).fail(function(jqXHR) 
		{
			console.log('register: There was an error with register. Error ' + jqXHR.status);
			$('#register .alert')
			.html(JSON.parse(jqXHR.responseText).message)
			.setAlertClass('danger')
			.fadeIn();
        });
    }
}

function LoginViewModel() 
{
    var self = this;
    self.username = ko.observable('').extend({ required: true, maxLength: 50, minLength:2 });
    self.password = ko.observable('').extend({ required: true, maxLength: 60, minLength:6 });
	self.remember = ko.observable(false);

    self.dologin = function() {
		$('#login .message').text('').fadeOut(100);
		if (self.username() == '' || self.password() == '')
		{
			$('#login .message').text('You have not completed all the required fields.').fadeIn(500);
			return;
		}
        currentUserViewModel.login(self.username(), self.password(), self.remember());
    }
    
	self.logout = function()
	{
		console.log("logout  called...");
		self.username = "";
		self.password = "";
		self.currentuser("");
		self.username.isModified(false);
		self.password.isModified(false);
	}
	self.clear = function()
	{
		self.username(''); 
		self.password('');
		self.username.isModified(false);
		self.password.isModified(false);
		self.remember(false);
	}
	self.close = function()
	{
		$('#login .message').text('').hide();
		self.username('');
		self.password('');
		self.username.isModified(false);
		self.password.isModified(false);
		self.remember(false);
		$('#login').modal('hide');
	}
}

function ThreeWayVoteViewModel() 
{
    var self = this;
    self.id = ko.observable();
    self.uri = ko.observable();

    self.close3WayTriangle = function()
	{
		$('#vote3waywindow').modal('hide');
	}
}

function AddProposalViewModel() 
{
    var self = this;
    self.title = ko.observable('').extend({ required: true, maxLength: 50, minLength:2 });
    self.abstract = ko.observable('').extend({ maxLength: 1000, minLength:10 });
    self.blurb = ko.observable('').extend({ required: true, maxLength: 1000, minLength:10 });

    self.addProposal = function() { //now
        $('#addproposal .alert').text('').fadeOut(100);
		if (self.title() == '' || self.blurb() == '')
		{
			$('#addproposal .alert').text('You have not completed all the required fields.')
			.fadeIn(500);
			return;
		}
        proposalsViewModel.add({
            title: self.title(),
			abstract: self.abstract(),
            blurb: self.blurb()
        });
    }
    self.clear = function()
	{
		self.title(''); 
		self.abstract('');
		self.blurb('');
		self.title.isModified(false);
		self.abstract.isModified(false);
		self.blurb.isModified(false);
	}
	self.close = function()
	{
		$('#addproposal .alert').text('').hide();
		self.clear();
		$('#addproposal').modal('hide');
	}
}

function NewCommentViewModel()
{
	var self = this;
	self.comment = ko.observable().extend({ required: true, maxLength: 300, minLength:10 });
	
	self.validate_comment_type = ko.observable(true);
    self.comment_type = ko.observable().extend({ required: { onlyIf: self.validate_comment_type } });
	//self.comment_type = ko.observable().extend({ required: true });
	
	self.comment_type_options = ['for', 'against'];
	
	self.setProposal = function(proposal)
	{
		self.proposal = proposal;
	}
	
	self.clear = function() // noo
	{
	    console.log("newCommentViewModel clear called..");
	    self.comment('')
	    self.comment_type(null);
	    self.comment.isModified(false);
		self.comment_type.isModified(false);
		$('.newcommentpanel .alert')
				.html('')
				.setAlertClass('danger')
				.fadeOut();
	}
	
	self.resetNewCommentPanel = function()
	{
		console.log("resetNewCommentPanel called.....");
		var panel = $('.newcommentpanel');
		self.clear();
		if ($('.newcommentpanel').is(":visible"))
		{
          return panel.slideUp(400);
          self.clear();
        } 
		else
		{
			return true;
		}
	}
	self.showNewCommentPanel = function()
	{
		console.log("showNewCommentPanel called..");
		var panel = $('.newcommentpanel');
		if (panel.is(":visible")) 
		{
          panel.slideUp(400);
          self.resetNewCommentPanel();
        } 
		else 
		{
          panel.slideDown(400);
        }
	}
	self.add = function()
	{
		console.log("NewCommentViewModel.add() called ...");		
		var reply_to = $('.newcommentpanel #reply_to').attr('value');
		var new_comment_type = $('.newcommentpanel #new_comment_type').attr('value');
		if (new_comment_type == 'answer' || new_comment_type == 'question')
		{
			viewProposalViewModel.addComment({
                comment: self.comment(),
                comment_type: new_comment_type,
				reply_to: reply_to
        	});
		}
		else 
		{
            viewProposalViewModel.addComment({
                comment: self.comment(),
                comment_type: self.comment_type()
            });
		}
	}
}

function ViewProposalViewModel()
{
	var self = this;
	self.id = ko.observable();
	self.title = ko.observable();
	self.blurb = ko.observable();
	self.author = ko.observable();
	self.endorse_type = ko.observable();
	self.comments = ko.observableArray();
	self.author_id = ko.observable();
	self.index;
	
	self.getCommentCount = function()
	{
		var count = 0
		ko.utils.arrayFirst(self.comments(), function (comment)
        {
            if (comment.comment_type() == 'for' || comment.comment_type() == 'against')
			{
				count++;
			}
        });
        return count;
	};
	self.getQuestionCount = function()
	{
		var count = 0
		ko.utils.arrayFirst(self.comments(), function (comment)
        {
            if (comment.comment_type() == 'question')
			{
				count++;
			}
        });
        return count;
	};
	
	self.getAnswer = function(id)
    {
        var match = ko.utils.arrayFirst(self.comments(), function (comment)
        {
            return comment.reply_to() === id();
        });
        if (!match)
            return 'No answer yet';
        else
            return match.comment();
    };
	self.getAnswerObject = function(id)
    {
		var match = ko.utils.arrayFirst(self.comments(), function (comment)
        {
			return comment.reply_to() === id();
        });
        if (!match)
            return false;
        else
            return match;
    };
	
	self.userSupports = function(comment)
    {
		if (!comment)
		{
			return false;
		}
		var match = ko.utils.arrayFirst(comment.supporters(), function (supporter_id)
        {
            return supporter_id === parseInt(currentUserViewModel.user.id);
        });
        if (!match)
            return false;
        else
            return true;
    };
	
	self.clearComments = function()
	{
		self.comments([]);
	}
	
	/* 
		View Proposal Panels
	*/
	self.reset = function()
	{
		$('#showquestions').css('display', 'none');
		$('#showcomments').css('display', 'none');
		$('.newcommentpanel').css('display', 'none');
		$('#propdetails').show(1);
	}
	self.displayProposalContent = function()
	{
		var $showing = $('#showquestions, #showcomments').filter(function() {
		   return $(this).is(':visible');
	    });
		$showing.hide(1, function()
		{
			$('#propdetails').show(1);
		});
	}
	self.showProposalContent = function()
	{
		newCommentViewModel().resetNewCommentPanel();
		var $showing = $('#showquestions, #showcomments').filter(function() {
		   return $(this).is(':visible');
	    });
		$showing.fadeOut(function()
		{
			$('#propdetails').fadeIn();
		});
	}
	self.showProposalComments = function()
	{
		newCommentViewModel().resetNewCommentPanel();
		var $showing = $('#propdetails, #showquestions').filter(function() {
		   return $(this).is(':visible');
	    });
		$showing.fadeOut(function()
		{
			$('#showcomments').fadeIn();
		});
	}
	self.showProposalQuestions = function()
	{
		newCommentViewModel().resetNewCommentPanel();
		var $showing = $('#propdetails, #showcomments').filter(function() {
		   return $(this).is(':visible');
	    });
		$showing.fadeOut(function()
		{
			$('#showquestions').fadeIn();
		});
	}
	
	self.beginNewComment = function(operation, proposalmodel, reply_to)
	{
		console.log('beginNewComment called with op ' + operation);
		//return;
		newCommentViewModel().setProposal(proposalmodel);
		$.when(newCommentViewModel().resetNewCommentPanel()).done(function()
		{
			if (operation == 'question')
			{
				$('.newcommentpanel #new_comment_type').attr('value', 'question');
				$('.newcommentpanel h4').text('Ask the author of the proposal a question');
				$('.newcommentpanel #form-type-select').addClass('hidden');
				$('.newcommentpanel #comment-label').text('Question');
				$('.newcommentpanel textarea').attr('placeholder', 'Question Text');
				newCommentViewModel().validate_comment_type(false);
			}
			else if (operation == 'answer')
			{
				$('.newcommentpanel #new_comment_type').attr('value', 'answer');
				$('.newcommentpanel #reply_to').attr('value', reply_to);
				$('.newcommentpanel h4').text('Answer this question');
				$('.newcommentpanel #form-type-select').addClass('hidden');
				$('.newcommentpanel #comment-label').text('Answer');
				$('.newcommentpanel textarea').attr('placeholder', 'Answer Text');
				newCommentViewModel().validate_comment_type(false);
			}
			else // comment
			{
				$('.newcommentpanel #new_comment_type').attr('value', 'comment');
				$('.newcommentpanel h4').text('Add a point for or aginst this proposal');
				$('.newcommentpanel #form-type-select').removeClass('hidden');
				$('.newcommentpanel #comment-label').text('Comment');
				$('.newcommentpanel textarea').attr('placeholder', 'Comment Text');
				newCommentViewModel().validate_comment_type(true);
			}
			console.log('comment_type default = ' + newCommentViewModel().comment_type());
			newCommentViewModel().showNewCommentPanel();
		});
	}
	
	self.beginAnswer = function(commentmodel)
	{
		console.log('beginAnswer called for comment ' + commentmodel.id());
		self.beginNewComment('answer', viewProposalViewModel, commentmodel.id());
	}

	self.toggleCommentSupport = function(comment)
	{
		console.log("ViewProposalViewModel.toggleCommentSupport() called for comment " + comment.id() + " ...");
		var OPP = 'POST';
		if (self.userSupports(comment))
		{
			OPP = 'DELETE';
		}
		var URI = VILFREDO_API + '/questions/'+ question_id +'/proposals/' + self.proposal.id() + '/comments/' + comment.id() + '/support';
		console.log("ViewProposalViewModel.supportComment() URI set to " + URI);
		ajaxRequest(URI, OPP).done(function(data, textStatus, jqXHR) 
		{
		    console.log('toggleCommentSupport data returned...');
			console.log(data);
			
			if (jqXHR.status == 201)
			{
				console.log(data.message);
				console.log('Updating comment ' + comment.id());
				comment.supporters(JSON.parse(data.supporters));
			}
			else
			{
				console.log(jqXHR.status);
			}
		});
	}
	
	self.addComment = function(comment)
	{
		console.log("ViewProposalViewModel.addComment() called for proposal" + self.proposal.id() + " ...");
		var URI = VILFREDO_API + '/questions/'+ question_id +'/proposals/' + self.proposal.id() + '/comments';
		ajaxRequest(URI, 'POST', comment).done(function(data, textStatus, jqXHR) {
		    console.log('Add comment data returned...');
			console.log(data);
			
			if (jqXHR.status == 201)
			{
				newCommentViewModel().showNewCommentPanel();
				console.log('Updating comments list for propsalal' + self.proposal.id());
				self.comments.push({
		      		id: ko.observable(data.comment.id),
					comment: ko.observable(data.comment.comment),
		      		comment_type: ko.observable(data.comment.comment_type),
		      		created: ko.observable(data.comment.created),
					reply_to: ko.observable(data.comment.reply_to),
					author_id: ko.observable(data.comment.author_id),
					supporters: ko.observableArray(JSON.parse(data.comment.supporters))
		  		});
			}
			else
			{
				console.log('addcomment: There was an problem adding the comment. Status ' + jqXHR.status);
				$('.newcommentpanel .alert')
				.html(data.message)
				.setAlertClass('danger')
				.fadeIn();
			}
		}).fail(function(jqXHR) 
		{
			console.log('addcomment: There was an error with add comment. Status ' + jqXHR.status);
			$('.newcommentpanel .alert')
			.html(JSON.parse(jqXHR.responseText).message)
			.setAlertClass('danger')
			.fadeIn();
        });
	}
	
	self.setIndex = function(index)
	{
		self.index = index;
	}
	
	self.openvotemap = function(proposal)
	{
		if (question.phase != 'voting') return;
		var index = proposalsViewModel.getProposalIndex(proposal.id());
		console.log("ViewProposalViewModel.openvotemap called with index " + index + ' and proposal ' + proposal.id());
		voteMapViewModel.proposal_index(index);
		voteMapViewModel.proposal_id(proposal.id());
		voteMapViewModel.endorse_type(proposal.endorse_type());
		$('#votemap-thisprop').html(proposal.title());
		$('#votemapwindow').modal('show');
	}
	
	self.setProposal = function(proposal)
	{
		self.proposal = proposal;
		self.id(proposal.id());
		self.title(proposal.title());
		self.blurb(proposal.blurb());
		self.author(proposal.author());
		self.author_id(proposal.author_id());
		self.endorse_type(proposal.endorse_type());
		self.comments([]);
		self.fetchComments();
	}
	
	self.init3WayTriangle = function(svg)
	{
		console.log('ViewProposalViewModel.init3WayTriangle called **************');
		var index = parseInt($(this).data('index'));
		console.log("init3WayTriangle: setting with index " + index);
		$('.oppose', svg.root()).click(function(e) {
			console.log("I oppose proposal with index " + index);
			proposalsViewModel.endorseWithIndex('oppose', index);
		});
		$('.endorse', svg.root()).click(function(e) {
        	console.log("I endorse proposal with index " + index);
			proposalsViewModel.endorseWithIndex('endorse', index);
		});
		$('.confused', svg.root()).click(function(e) {
        	console.log("I do not understand proposal with index " + index);
			proposalsViewModel.endorseWithIndex('confused', index);
		});
	}
	
	self.loadTriangle = function()
	{
		console.log("ViewProposalViewModel.loadTriangle called>>>>>>>>>>>>>>>");
		if (questionViewModel.phase() == 'voting')
		{
			console.log('Loading voting triangle to view proposal window...');
			
			/*
			if ($('.votebox').svg('get'))
            {
                console.log('Removing svg from votebox------------');
                $('.votebox').svg('destroy').data('pid', false).data('index', false);
            }*/
			
			$('.votebox').data('pid', self.proposal.id).addClass('threeway').data('index', self.index);
			//$('.votebox').svg({loadURL: flask_util.url_for('static', {filename:'images/triangle.svg'}),
			/*
			$('.votebox').svg({loadURL: STATIC_FILES + '/images/triangle.svg', //});
							   onLoad: init3WayTriangle});
			*/
			
			//var bg_image = "url('" + STATIC_FILES + "/images/triangle.svg" + "')";
			//$('.votebox').css('background-image', bg_image);
		}
	}
	
	self.fetchComments = function() {
		ajaxRequest(VILFREDO_API + '/questions/'+ question_id +'/proposals/'+ self.proposal.id() +'/comments', 
					'GET').done(function(data, textStatus, jqXHR) {
		    console.log('Comments data returned...');
			console.log(data);
			for (var i = 0; i < data.comments.length; i++) {
		  		var supporters = JSON.parse(data.comments[i].supporters)
				self.comments.push({
		      		id: ko.observable(data.comments[i].id),
					comment: ko.observable(data.comments[i].comment),
		      		comment_type: ko.observable(data.comments[i].comment_type),
		      		created: ko.observable(data.comments[i].created),
					reply_to: ko.observable(data.comments[i].reply_to),
					author_id: ko.observable(data.comments[i].author_id),
					supporters: ko.observableArray(JSON.parse(data.comments[i].supporters))
		  		});
			}
			console.log(data.comments.length + " comments loaded");
		});
	}
}



function QuestionsViewModel()
{
    var self = this;
    self.questions = ko.observableArray();
    
    self.addQuestion = function(question) 
	{
		console.log("QuestionsViewModel.addQuestion() called...");
		console.log(question);
		var URI = VILFREDO_API + '/questions';
		ajaxRequest(URI, 'POST', question).done(function(data, textStatus, jqXHR) {
		    console.log('Add question data returned...');
			console.log(data);
			
			if (jqXHR.status == 201)
			{
				newQuestionViewModel().close();
				
				console.log('Updating questions list');
				self.questions.push({
		      		id: ko.observable(data.question.id),
					title: ko.observable(data.question.title),
		      		blurb: ko.observable(data.question.blurb),
		      		author: ko.observable(data.question.author),
					uri: ko.observable(data.question.url),
					phase: ko.observable(data.question.phase),
					last_move_on : ko.observable(parseInt(data.question.last_move_on)),
            		minimum_time : ko.observable(parseInt(data.question.minimum_time)),
            		maximum_time : ko.observable(parseInt(data.question.maximum_time)),
					author_id: ko.observable(parseInt(data.question.author_id)),
					generation: ko.observable(parseInt(data.question.generation)),
					proposal_count: ko.observable(parseInt(data.question.proposal_count)),
					new_proposal_count: ko.observable(parseInt(data.question.new_proposal_count)),
					new_proposer_count: ko.observable(parseInt(data.question.new_proposer_count)),
					consensus_found: ko.observable(data.question.consensus_found),
					inherited_proposal_count: ko.observable(parseInt(data.question.inherited_proposal_count)),
					link: VILFREDO_URL + "/question/" + data.question.id
		  		});
			}
			else
			{
				console.log(jqXHR.status);
				$('.addquestion .alert')
				.html(data.message)
				.setAlertClass('danger')
				.fadeIn()
			}
		}).fail(function(jqXHR) {
            console.log('addQuestion: There was an error. Error ' + jqXHR.status);
            // Set modal alert
            $('#addquestion .alert')
            .text(JSON.parse(jqXHR.responseText).message)
            .setAlertClass('danger')
            .fadeIn()
        });
	}
	
    self.fetchQuestions = function() {
		var url = VILFREDO_API + '/questions';
		var room_query = (room) ? '?room=' + room : '';
		ajaxRequest(url+room_query, 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('Questions data returned...');
			console.log(data);
			self.questions([]);
			for (var i = 0; i < data.questions.length; i++) {
		  		self.questions.push({
		      		id: ko.observable(data.questions[i].id),
					title: ko.observable(data.questions[i].title),
		      		blurb: ko.observable(data.questions[i].blurb),
		      		author: ko.observable(data.questions[i].author),
					uri: ko.observable(data.questions[i].url),
					phase: ko.observable(data.questions[i].phase),
					last_move_on : ko.observable(parseInt(data.questions[i].last_move_on)),
            		minimum_time : ko.observable(parseInt(data.questions[i].minimum_time)),
            		maximum_time : ko.observable(parseInt(data.questions[i].maximum_time)),
					author_id: ko.observable(parseInt(data.questions[i].author_id)),
					generation: ko.observable(parseInt(data.questions[i].generation)),
					proposal_count: ko.observable(parseInt(data.questions[i].proposal_count)),
					new_proposal_count: ko.observable(parseInt(data.questions[i].new_proposal_count)),
					new_proposer_count: ko.observable(parseInt(data.questions[i].new_proposer_count)),
					consensus_found: ko.observable(data.questions[i].consensus_found),
					inherited_proposal_count: ko.observable(parseInt(data.questions[i].inherited_proposal_count)),
					link: VILFREDO_URL + "/question/" + data.questions[i].id
		  		});
			}
		});
	}
	self.beginNewQuestion = function()
	{
	    console.log('begin_new_question'); 
	    $('#addquestion').modal('show');
	}
	self.is_new_question = function(question)
	{
	    return question.generation() == 1 && question.proposal_count() == 0;
	}
	self.tooltip = function(question)
	{
	    html = "<div>";
	    html = html + question.blurb().substr(0, 150) + '...</div>';
	    html = html + "<strong>Generation: " + question.generation() + "</strong>";
	    if (question.new_proposal_count() > 0)
	    {
	        html = html + "<br>Recently "
	            + question.new_proposer_count() + " users proposed " 
	            + question.new_proposal_count() + " proposals";
	    }
	    else
	    {
	        html = html + "<br>No new proposals so far.";
	    }
	    if (question.inherited_proposal_count() > 0)
	    {
	        html = html + "<br>There are " 
		        + question.inherited_proposal_count() 
		        + " inherited from the previous generation";
	    }
	    return html;
	}
	self.minimum_time_passed = function(question)
	{
        return (get_timestamp() - question.last_move_on()) > question.minimum_time();
    }
    self.maximum_time_passed = function(question)
    {
        return (get_timestamp() - question.last_move_on()) > question.maximum_time();
	}
}

function VoteMapViewModel()
{
    var self = this;
    self.proposal_index = ko.observableArray();
    self.proposal_id = ko.observableArray();
    self.endorse_type = ko.observableArray();
}

function ProposalsViewModel()
{
    var self = this;
    
	// Voting phase only
	self.proposals = ko.observableArray();
	self.key_players = ko.observableArray();
	// Writing phase only
	self.inherited_proposals = ko.observableArray();
	
	self.getUserKeyPlayerInfo = function() //donow
    {
        var match = ko.utils.arrayFirst(self.key_players(), function (key_player)
        {
            return currentUserViewModel.userid() === key_player.id();
        });
        console.log('getUserKeyPlayerInfo');
        if (match) 
        {
            //console.log('Current user IS a key player');
            //console.log(match.id());
        }
        else
        {
            //console.log('Current user IS NOT a key player');
        }
        return match;
    };
	
	self.vote_for_list_v3 = function (props) 
	{
	    html = '';
	    for (var i = 0; i < props.length; i++) 
	    {
	        html = html + '<span class="prop_link">' + props[i] + '</span>'
	    }
	    return html;
    }
	
	self.vote_for_list_v2 = function (keyplayer) 
	{
	    html = '';
	    $.each(keyplayer.add_vote(), function (endorse_type, pids) 
	    {
            switch(endorse_type)
            {
                case 'notvoted':
                    html = html + '<br>Did not vote for proposals '
                    $.each(pids, function (pid) 
                    {
                        html = html + '<span class="prop_link">' + pid + '</span>'
                    })
                    break;
                case 'oppose':
                    html = html + '<br>Voted against proposals '
                    $.each(pids, function (pid) 
                    {
                        html = html + '<span class="prop_link">' + pid + '</span>'
                    })
                    break;
                case 'confused':
                    html = html + '<br>Did not understand proposals '
                    $.each(pids, function (pid) 
                    {
                        html = html + '<span class="prop_link">' + pid + '</span>'
                    })
                    break;
                default:  
            }
        })
	    return html;
	}
	
	self.vote_for_list = function (keyplayer) {
	    html = '';
	    for (var i = 0; i < keyplayer.add_vote().length; i++) 
	    {
	        html = html + '<span class="prop_link">' + keyplayer.add_vote()[i] + '</span>'
	    }
	    return html;
	}
	
	self.getProposalIndex = function(proposal_id)
	{
	    console.log("ProposalsViewModel.getProposalIndex() called with pid = " + proposal_id);
	    return arrayFirstIndexOf(proposalsViewModel.proposals(), function(item) {
           return item.id() === proposal_id;    
        });
	}
	
	self.showProposalNode = function(proposal_id)
	{
	    console.log("ProposalsViewModel.showProposalNode() called with pid = " + proposal_id);
	    var index = arrayFirstIndexOf(proposalsViewModel.proposals(), function(item) {
           return item.id() === proposal_id;    
        });
        var proposal = proposalsViewModel.proposals()[index];
	    self.read(index, proposal);
	}
	
	self.readproposal = function(id)
	{
	    console.log("ProposalsViewModel.readproposal called with id " + id);
	    index = self.fetchIndex(id);
	}
	
	self.openvotemap = function(index, proposal)
	{
		console.log("ProposalsViewModel.openvotemap called with index " + index + ' and proposal ' + proposal.id());
		voteMapViewModel.proposal_index(index);
		voteMapViewModel.proposal_id(proposal.id());
		voteMapViewModel.endorse_type(proposal.endorse_type());
		$('#votemap-thisprop').html(proposal.title());
		$('#votemapwindow').modal('show');
	}
	
	self.read = function(index, proposal)
	{
		console.log("ProposalsViewModel.read called with index " + index);
		viewProposalViewModel.setProposal(proposal);
		viewProposalViewModel.index = index;
		viewProposalViewModel.loadTriangle();
		viewProposalViewModel.reset();
		$('#viewproposal').modal('show');
	}
	
	self.add = function(proposal)
	{
		var URI = VILFREDO_API + '/questions/'+ question_id +'/proposals';
		ajaxRequest(URI, 'POST', proposal).done(function(data, textStatus, jqXHR) {
		    console.log('Proposals data returned...');
			console.log(data);
			console.log('textstatus = ' + textStatus);
			console.log('status code = ' + jqXHR.statusCode());
			
			if (jqXHR.status == 201)
			{
	  		    self.proposals.push({
					id: ko.observable(parseInt(data.proposal.id)),
					title: ko.observable(data.proposal.title),
		      		blurb: ko.observable(data.proposal.blurb),
		      		author: ko.observable(data.proposal.author),
					endorse_type: ko.observable(data.proposal.endorse_type),
					uri: ko.observable(data.proposal.uri),
					author_id: ko.observable(parseInt(data.proposal.author_id)),
					question_count: ko.observable(parseInt(data.proposal.question_count)),
					comment_count: ko.observable(parseInt(data.proposal.comment_count))
		  		});
		  		addProposalViewModel().close();
	  		}
	  		else
			{
				console.log(jqXHR.status);
				$('#addproposal .alert')
				.text(data.error)
				.setAlertClass('danger')
				.fadeIn()
			}
		}).fail(function(jqXHR) {
            console.log('register: There was an error with register. Error ' + jqXHR.status);
            $('#addproposal .alert')
            .text(JSON.parse(jqXHR.responseText).message)
            .setAlertClass('danger')
            .fadeIn()
        });
	}
	
	self.endorse = function(endorsement_type, proposal)
	{
		if (currentUserViewModel.isLoggedIn() == false)
		{
		    console.log("Not logged in");
		    return;
		}
		console.log(endorsement_type);
		var endorse_uri = VILFREDO_API + '/questions/'+ question_id +'/proposals/'+ proposal.id() +'/endorsements';
		console.log('endorse uri = ' + endorse_uri);
		
		ajaxRequest(endorse_uri, 'POST', {endorsement_type:endorsement_type})
		.done(function(data, textStatus, jqXHR)
		{
		    console.log('Proposals data returned...');
			console.log(data);
			
			if (jqXHR.status == 201)
			{
				console.log('Updating proposal ' + proposal.id() + ' to ' + endorsement_type);

				var prev_endorsement_type = proposal.endorse_type();
				proposal.endorse_type(endorsement_type);
				if ( (prev_endorsement_type == 'endorse'
					&& (endorsement_type == 'confused' || endorsement_type == 'oppose')) 
				|| (endorsement_type == 'endorse'
					&& (prev_endorsement_type == 'confused' || prev_endorsement_type == 'oppose'
					    || prev_endorsement_type == 'notvoted')) )
				{
					console.log('Refreshing graphs after vote...');
					fetchVotingGraphs();
				}
			}
			else
			{
				console.log(jqXHR.status);
			}
		});
	}
	
	// Add endorsement using normalised votemap coordinates
	self.mapEndorseWithIndex = function(mapx, mapy, index)
	{
		if (currentUserViewModel.isLoggedIn() == false)
		{
		    console.log("Not logged in");
		    return;
		}
		var proposal = self.proposals()[index];
		console.log('mapEndorseWithIndex called with index ' + index + ' and coords ' + mapx + ', ' + mapy);
		var endorse_uri = VILFREDO_API + '/questions/'+ question_id +'/proposals/'+ proposal.id() +'/endorsements';
		console.log('endorse uri = ' + endorse_uri);
		
		// Normalized vote coordinates
        var coords = {mapx: mapx, mapy: mapy};
		
		ajaxRequest(endorse_uri, 'POST', {use_votemap:true, coords:coords})
		.done(function(data, textStatus, jqXHR)
		{
		    console.log('Proposals data returned...');
			console.log(data);
			
			if (jqXHR.status == 201)
			{
				console.log('Updating proposal ' + proposal.id() + ' to ' + data.endorsement_type);
				var prev_endorsement_type = proposal.endorse_type();
				proposal.endorse_type(data.endorsement_type);
				viewProposalViewModel.setProposal(proposal);
				if ( (prev_endorsement_type == 'endorse'
					&& (data.endorsement_type == 'confused' || data.endorsement_type == 'oppose')) 
				|| (data.endorsement_type == 'endorse'
					&& (prev_endorsement_type == 'confused' || prev_endorsement_type == 'oppose'
					    || prev_endorsement_type == 'notvoted')) )
				{
					console.log('Refreshing graphs after vote...');
					fetchVotingGraphs();
				}
				
				// Update vote coordinates and endorsement type
				proposal.endorse_type(data.endorsement_type);
				proposal.mapx = mapx;
				proposal.mapy = mapy;
				
				// Draw vote on votemap if displayed
				setVote(proposal);
				/*
				var svg = $('#modalvotesmap').svg('get');
				if (svg)
				{
				    setVote(svg, proposal);
				}
				*/
				// reset key players
				self.fetchKeyPlayers();
			}
			else
			{
				console.log(jqXHR.status);
			}
		});
	}
	
	self.endorseWithIndex = function(endorsement_type, index)
	{
		if (currentUserViewModel.isLoggedIn() == false)
		{
		    console.log("Not logged in");
		    return;
		}
		var proposal = self.proposals()[index];
		console.log('endorseWithIndex called with index ' + index + ' and endorsement_type ' + endorsement_type);
		var endorse_uri = VILFREDO_API + '/questions/'+ question_id +'/proposals/'+ proposal.id() +'/endorsements';
		console.log('endorse uri = ' + endorse_uri);
		
		ajaxRequest(endorse_uri, 'POST', {endorsement_type:endorsement_type})
		.done(function(data, textStatus, jqXHR)
		{
		    console.log('Proposals data returned...');
			console.log(data);
			
			if (jqXHR.status == 201)
			{
				console.log('Updating proposal ' + proposal.id() + ' to ' + endorsement_type);
				var prev_endorsement_type = proposal.endorse_type();
				proposal.endorse_type(endorsement_type);
				viewProposalViewModel.setProposal(proposal);
				if ( (prev_endorsement_type == 'endorse'
					&& (endorsement_type == 'confused' || endorsement_type == 'oppose')) 
				|| (endorsement_type == 'endorse'
					&& (prev_endorsement_type == 'confused' || prev_endorsement_type == 'oppose'
					    || prev_endorsement_type == 'notvoted')) )
				{
					console.log('Refreshing graphs after vote...');
					fetchVotingGraphs();
				}
				// reset key players
				self.fetchKeyPlayers();
			}
			else
			{
				console.log(jqXHR.status);
			}
		});
	}
	
	self.show3WayTriangle = function()
	{
		console.log('show3WayTriangle called...');
		$('#vote3waywindow').modal('show');		
		$('#vote3waywindow .show3waytriangle').svg(
		    {loadURL: flask_util.url_for('static', {filename:'images/triangle.svg'}),
			onLoad: init3WayTriangle});	
	}
	
	self.showTriangle = function()
	{
		console.log('showTriangle called...');
		return;
		$('#votenowwindow').modal('show');
		//$('.showtriangle').svg({onLoad: drawVotingTriangle});
		$('#votenowwindow .showtriangle').svg(
		    {loadURL: flask_util.url_for('static', {filename:'images/triangle.svg'}), 
		    onLoad: initTriangle});
	}
	
	self.fetchKeyPlayers = function() {
		var URI = VILFREDO_API + '/questions/' + question_id + '/key_players?' + 'algorithm=' + ALGORITHM_VERSION;	
		return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('Key Player data returned...');
			console.log(data.key_players);
			//console.log(data.key_players[0]);
			//console.log(data.key_players[0]['user'].id);
			//return;
			self.key_players([]);
			for (var i = 0; i < data.key_players.length; i++) {
		  		self.key_players.push({
		      		id: ko.observable(parseInt(data.key_players[i]['user'].id)),
					username: ko.observable(data.key_players[i]['user'].username),
		      		add_vote: ko.observable(data.key_players[i]['add_vote'])
		  		});
			}
		});
	}
	
	self.fetchInheritedProposals = function() {
	    console.log('fetchInheritedProposals() called...');
		var proposalsURI = VILFREDO_API + '/questions/'+ question_id +'/proposals';
		proposalsURI = proposalsURI + '?inherited_only=true';

		ajaxRequest(proposalsURI, 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('Proposals data returned...');
			console.log(data);
			self.proposals([]);
			for (var i = 0; i < data.proposals.length; i++) {
		  		self.inherited_proposals.push({
		      		id: ko.observable(parseInt(data.proposals[i].id)),
					title: ko.observable(data.proposals[i].title),
		      		blurb: ko.observable(data.proposals[i].blurb),
		      		author: ko.observable(data.proposals[i].author),
					endorse_type: ko.observable(data.proposals[i].endorse_type),
					uri: ko.observable(data.proposals[i].uri),
					author_id: ko.observable(parseInt(data.proposals[i].author_id)),
					question_count: ko.observable(parseInt(data.proposals[i].question_count)),
					comment_count: ko.observable(parseInt(data.proposals[i].comment_count)),
					mapx: parseFloat(data.proposals[i].mapx),
					mapy: parseFloat(data.proposals[i].mapy)
		  		});
			}
		});
	}

	self.fetchProposals = function(options) {
	    console.log('fetchProposals() called...');
		var proposalsURI = VILFREDO_API + '/questions/'+ question_id +'/proposals';
		var proposals_list = self.proposals;
		
	    if (options != null && options.user_only != null)
	    {
	        proposalsURI = proposalsURI + '?user_only=true';
	    }
	    /*
	    else if (options != null && options.inherited_only != null)
	    {
	        proposalsURI = proposalsURI + '?inherited_only=true';
	        // Add to inherited list
	        proposals_list = self.inherited_proposals;
	    }
	    */
		ajaxRequest(proposalsURI, 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('Proposals data returned...');
			console.log(data);
			self.proposals([]);
			for (var i = 0; i < data.proposals.length; i++) {
		  		proposals_list.push({
		      		id: ko.observable(parseInt(data.proposals[i].id)),
					title: ko.observable(data.proposals[i].title),
		      		blurb: ko.observable(data.proposals[i].blurb),
		      		author: ko.observable(data.proposals[i].author),
					endorse_type: ko.observable(data.proposals[i].endorse_type),
					uri: ko.observable(data.proposals[i].uri),
					author_id: ko.observable(parseInt(data.proposals[i].author_id)),
					question_count: ko.observable(parseInt(data.proposals[i].question_count)),
					comment_count: ko.observable(parseInt(data.proposals[i].comment_count)),
					mapx: parseFloat(data.proposals[i].mapx),
					mapy: parseFloat(data.proposals[i].mapy)
		  		});
			}
			
			if (questionViewModel.phase() == 'voting')
			{
				$('.voting').each(function(){
					var index = $(this).parents('.panel').siblings('.index')[0].value;
					var pid = $(this).parents('.panel').siblings('.propId')[0].value;
					//console.log('adding pid ' + pid + ' and threeway class to voting container...');
					$(this).data('pid', pid).addClass('threeway').data('index', index);
					//console.log('check if pid added ==> ' + $(this).data('pid'));
					console.log('Load triangle into proposal box');
					//$(this).svg({loadURL: flask_util.url_for('static', {filename:'images/triangle.svg'}),
					$(this).svg({loadURL: STATIC_FILES + '/images/triangle.svg',
								 onLoad: init3WayTriangle});
				});
				self.fetchKeyPlayers();
			}
		});
	}
	
	self.beginNew = function() {
        $('#addproposal').modal('show');
    }
	
	//self.fetchProposals();
	//self.beginLogin();
}


function drawTriangle(svg)
{
	var path = svg.createPath();
    var triangle = svg.path(
        path.move( 100, 0)
        .line( -100, 200, true )
        .line( 200, 0, true )
        .close(),
        {
            fill: 'blue', 
            stroke: 'white', 
            strokeWidth: 2
        }
    );
}

function setTriangleSize(svg) 
{
	//console.log("setTriangleSize called...");
	var width = 700;
	var height = 700; 
	gwidth = width || $(svg._container).innerWidth();
	gheight = height || $(svg._container).innerHeight();
	svg.configure({width: gwidth, height: gheight}, true);
}

function initTriangle(svg)
{
	var tri = $('#votenowwindow .showtriangle .votenow');
	$('#votenowwindow .showtriangle .votenow').on( "click", function(e) {
    	var posX = $(this).offset().left,
        posY = $(this).offset().top;
    	console.log((e.pageX - posX) + ' , ' + (e.pageY - posY));
	});
}


function init3WayTriangle(svg) // here
{
	
	return;
	
	var index = parseInt($(this).data('index'));
	console.log('init3WayTriangle function called... index = ' + index);
	$('.oppose', svg.root()).click(function(e) {
		//console.log("I oppose proposal " + index);
		proposalsViewModel.endorseWithIndex('oppose', index);
	});
	$('.endorse', svg.root()).click(function(e) {
    	//console.log("I endorse proposal " + index);
		proposalsViewModel.endorseWithIndex('endorse', index);
	});
	$('.confused', svg.root()).click(function(e) {
    	//console.log("I do not understand proposal " + index);
		proposalsViewModel.endorseWithIndex('confused', index);
	});
}

function drawVotingTriangle(svg)
{
	//svg.polygon([[0,0],[300,0],[150,211]],
	//	{fill: 'lime', stroke: 'blue', strokeWidth: 1, class: 'votenow'});
	
	svg.polygon([[1,1],[299,1],[149,210]],
		{fill: 'lime', stroke: 'blue', strokeWidth: 1, class: 'votenow'}); 
				
	/*
	svg.linearGradient(defs, 'myGrad', 
    	[[0, 'red'], [1, 'green']], 0, 0, 800, 0, 
	    {gradientUnits: 'userSpaceOnUse'});*/
}

function draw3WayVotingTriangle(svg, pid)
{
	var opposeColor = '#d9534f';
	var endorseColor = '#5cb85c';
	var confusedColor = '#428bca';

	var g = svg.group();
	$(g).data('pid', pid).addClass('threeway');
	var opposePath = svg.createPath();
    var oppose = svg.path(g,
        opposePath.move( 100, 0)
        .line( 0, 80, true )
        .line( -50, 20, true )
		.line( -50, -100, true )
        .close(),
        {
            fill: opposeColor, 
            stroke: opposeColor, 
            strokeWidth: 2,
			class: 'oppose',
			title: 'click if you oppose'
        }
    );
	$(oppose).click(function(e) {
    	console.log("I oppose");
		pid = $(this).parents('.threeway').data('pid');
		console.log("I oppose proposal " + pid);
		//proposalsViewModel.endorse(uri, 'oppose');
	});
	var endorsePath = svg.createPath();
	var endorse = svg.path(g,
        endorsePath.move( 100, 0)
        .line( 0, 80, true )
        .line( 50, 20, true )
		.line( 50, -100, true )
        .close(),
        {
            fill: endorseColor, 
            stroke: endorseColor, 
            strokeWidth: 2,
			class: 'endorse',
			title: 'click if you endorse'
        }
    );
	$(endorse).click(function(e) {
    	console.log("I endorse");
		pid = $(this).parents('.threeway').data('pid');
		console.log("I endorse proposal " + pid);
		//proposalsViewModel.endorse(uri, 'oppose');
	});
	var confusedPath = svg.createPath();
	var confused = svg.path(g,
        confusedPath.move( 100, 200)
        .line( 50, -100, true )
        .line( -50, -20, true )
		.line( -50, 20, true )
        .close(),
        {
            fill: confusedColor, 
            stroke: confusedColor, 
            strokeWidth: 2,
			class: 'confused',
			title: 'click if you do not fully understand'
        }
    );
	$(confused).click(function(e) {
    	console.log("I am confused");
		pid = $(this).parents('.threeway').data('pid');
		console.log("I am confused by proposal " + pid);
		//proposalsViewModel.endorse(uri, 'oppose');
	});
	//var panelwidth = 10;
	//var panelheight = 10;
	//svg.configure({viewBox: '0 0 '+panelwidth+' '+panelheight, width: panelwidth+'px', height: panelheight+'px'}, true);
}



/*
var questionViewModel = function(data) {
    ko.mapping.fromJS(data, {}, this);

    this.nameLength = ko.computed(function() {
        return this.name().length;
    }, this);
    
    this.canMoveOn = ko.computed(function() {
	    var currentdate = new Date();
	    var currentSeconds = currentdate.getSeconds();
	    console.log(this.minimum_time());
	    return true;
	};
}*/

function QuestionViewModel()
{
	var self = this;
	self.URI = VILFREDO_API + '/questions/' + question_id;		
	self.id = ko.observable();
	self.title = ko.observable();
	self.blurb = ko.observable();
	self.author = ko.observable();
	self.author_id = ko.observable();
	self.phase = ko.observable();
	self.generation = ko.observable();
	self.last_move_on = ko.observable();
	self.minimum_time = ko.observable();
	self.maximum_time = ko.observable();
	self.mapx = ko.observable();
	self.mapy = ko.observable();
	self.created;
	self.proposal_relations;
	
	self.domination_map_array = ko.observableArray([]);
	//self.domination_map = ko.observable();
	self.levels_map = ko.observable();
	self.voting_map = ko.observable();
	
    self.dom_table_algorithm = ko.observable(ALGORITHM_VERSION);
	self.levels_table_algorithm = ko.observable(ALGORITHM_VERSION);
	self.selected_generation = ko.observable(generation_id);
	
	self.hasConfusedVotes = function(generation_id) {
	    if (typeof(self.voting_map()) == 'undefined') return;
	    return self.voting_map()[generation_id]['confused_count'] + self.voting_map()[generation_id]['oppose_count'];
    }
    
    self.alternateVotes = function(generation_id) {
	    if (typeof(self.voting_map()) == 'undefined' || typeof(generation_id)  == 'undefined') return;
	    return 'Generation ' + generation_id + ' has ' + self.voting_map()[generation_id]['confused_count'] + ' confused and ' + self.voting_map()[generation_id]['oppose_count'] + ' opposed votes';
    }
    
    self.proposalVoting = function(pid) {
	    if (typeof(self.voting_map()) == 'undefined' || typeof(self.selected_generation()) == 'undefined' || typeof(pid) == 'undefined' || typeof(self.voting_map()[self.selected_generation()]['proposals'][pid].votes) == 'undefined' ) 
	    {
	        return 'no data available for proposal ' + pid + ' in generation ' + self.selected_generation();
        }
	    
	    console.log('selected_generation = ' + self.selected_generation());
	    console.log('pid = ' + pid);
	    votes = self.voting_map()[self.selected_generation()]['proposals'][pid]['votes'];
	    
	    title = '<strong>Proposal ' + pid + ':</strong><br><br> Endorsed by [' + votes['endorse'] + ']<br>';
	    title = title + 'Opposed by [' + votes['oppose'] + ']<br>';
	    title = title + 'Not understood by [' + votes['confused'] + ']';
	    return title;
    }
    
	
	self.allGenerations = ko.computed(function() {
        allgen = new Array();
        gen = 1;
        while (gen <= self.generation()) {
            allgen.push(gen);
            gen = gen + 1;
        }
        return allgen;
    });
    
    // Fetch voting map for all generaion of the question
    //
    self.fetchVotingMap = function() {
		var URI = VILFREDO_API + '/questions/' + question_id + '/voting_map';	
		return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('Voting Map data returned...');
			self.voting_map(data.voting_map);
		});
	}
    
    self.fetchTablesForSelectedGeneration = function(generation_id) {
        // Set the current generation for tables
        self.selected_generation(generation_id);

        self.domination_map_array([]);
        self.fetchDominationMap(self.dom_table_algorithm());
		self.fetchLevelsMap(self.levels_table_algorithm());
    }
    
    self.fetchTables = function(generation_id) {
        self.domination_map_array([]);
        self.selected_generation(generation_id);
        
        self.fetchDominationMap(self.dom_table_algorithm());
		self.fetchLevelsMap(self.levels_table_algorithm());
    }

	
	self.fetchLevelsMap = function(algorithm) {
		// Set the algorithm for the levels table
		self.levels_table_algorithm(algorithm);
		generation = self.selected_generation();
		self.levels_map();
		
		var URI = VILFREDO_API + '/questions/' + question_id + '/levels_map?' + 'generation=' + generation + '&algorithm=' + algorithm;	
		return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('Pareto Map data returned...');
			self.levels_map(data.levels_map);
		});
	}
	
	self.fetchDomMap = function(algorithm) {
	    // self.domination_map_array.removeAll();
	    console.log("fetchDomMap: using generation: " + self.selected_generation());
	    //alert('Parameter algorithm = ' + algorithm);
	    //alert(self.dom_table_algorithm());
	    console.log("fetchDomMap: using algorithm: " + self.dom_table_algorithm());
        self.fetchDominationMap(self.selected_generation(), algorithm);
    }
	
	self.fetchDominationMap = function(algorithm) {
		// Set the current domination table algorithm
		self.dom_table_algorithm(algorithm);
		
		// Reset the domination map
		self.domination_map_array([]);
		generation = self.selected_generation();
		
		var URI = VILFREDO_API + '/questions/' + question_id + '/domination_map?' + 'generation=' + generation + '&algorithm=' + algorithm;
		return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('Domination Map data returned...');
			//self.domination_map(data.domination_map);
			for (var i = 0; i < data.domination_map.length; i++) {
			    self.domination_map_array.push(data.domination_map[i]);
		    }
		    //alert(self.dom_table_algorithm());
		});
	}
	
	self.fetchProposalRelations = function(generation, algorithm) {
		var URI = VILFREDO_API + '/questions/' + question_id + '/proposal_relations?' + 'generation=' + generation + '&algorithm=' + algorithm;	
		return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('Proposal Relation data returned...');
			console.log(data.proposal_relations);
			self.proposal_relations = data.proposal_relations;
		});
	}
	
	self.compareProposalVotes = function(pid1, pid2)
    {
        if (typeof(self.voting_map()) == 'undefined' || typeof(pid1) == 'undefined' || typeof(pid2) == 'undefined') 
	    {
	        return 'no data available';
        }
        
        pid1_votes = self.voting_map()[self.selected_generation()]['proposals'][pid1]['votes'];
        pid2_votes = self.voting_map()[self.selected_generation()]['proposals'][pid2]['votes'];
        
        pid1_endorse_diff = arrayDiff(pid1['endorse'], pid2['endorse']);
        pid1_oppose_diff = arrayDiff(pid1['oppose'], pid2['oppose']);
        pid1_confused_diff = arrayDiff(pid1['confused'], pid2['confused']);

        pid2_endorse_diff = arrayDiff(pid2['endorse'], pid1['endorse']);
        pid2_oppose_diff = arrayDiff(pid2['oppose'], pid1['oppose']);
        pid2_confused_diff = arrayDiff(pid2['confused'], pid1['confused']);
        
        title = '<strong>Proposal ' + pid + ':</strong><br><br> Endorsed by [' + votes['endorse'] + ']<br>';
	    title = title + 'Opposed by [' + votes['oppose'] + ']<br>';
	    title = title + 'Not understood by [' + votes['confused'] + ']';
	    
	    title = "<table><tr><th></th><th>Endorsed</th><th>Opposed</th><th>Confused</th></tr>";
	    
	    return title;
    }
	
	self.canMoveOn = ko.computed(function() {
	    var currentdate = new Date();
	    var currentSeconds = currentdate.getSeconds();
	    return self.minimum_time();
	});
	
	self.show_next_phase = function()
	{
	    if (self.phase() == 'writing')
	    {
	        return 'voting';
	    }
	    else
	    {
	        return 'writing';
	    }
	}

	self.minimum_time_passed = function()
	{
        return (get_timestamp() - self.last_move_on()) > self.minimum_time();
    }
    
    self.maximum_time_passed = function()
    {
        return (get_timestamp() - self.last_move_on()) > self.maximum_time();
	}
	
	self.moveOn = function()
	{
	    console.log('moveOn called...');
	    //initPage();
	    //return;
	    ajaxRequest(VILFREDO_API + '/questions/' + question_id, 'PATCH', {move_on:true}).done(function(data) {
		    add_page_alert('success', 'Question now in ' + data.question.phase + ' phase');
		    console.log('Move on question data returned...');
			console.log(data);
			/*
    		self.phase(data.question.phase);
    		self.last_move_on(parseInt(data.question.last_move_on));
    		self.minimum_time(parseInt(data.question.minimum_time));
    		self.maximum_time(parseInt(data.question.maximum_time));
    		self.generation(data.question.generation);*/
    		initPage();
	    });
	}
	
	self.fetchQuestion = function()
	{
	    console.log('fetchQuestion called...');
	    return ajaxRequest(self.URI, 'GET').done(function(data) {
		    console.log('Question data returned...');
			console.log(data);
			self.id(data.question.id);
			self.title(data.question.title);
    		self.blurb(data.question.blurb);
    		self.author(data.question.author);
    		self.author_id(data.question.author_id);
    		self.phase(data.question.phase);
    		self.last_move_on(parseInt(data.question.last_move_on));
    		self.minimum_time(parseInt(data.question.minimum_time));
    		self.maximum_time(parseInt(data.question.maximum_time));
    		self.generation(parseInt(data.question.generation));
    		self.created = parseInt(data.question.created);
    		self.mapx = parseFloat(data.question.mapx);
    		self.mapy = parseFloat(data.question.mapy);
	    });
    }
}

function fetchGraph(map_type, generation)
{
	var URI = VILFREDO_API + '/questions/'+ question_id +'/graph?generation=' + generation + '&map_type=' + map_type + '&algorithm=' + ALGORITHM_VERSION;
	
	return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) {
	    console.log('fetchGraph data returned...');
		console.log(data);
	});
}

function fetchGraphs()
{
    console.log("fetchGraphs called...")
    //generation = parseInt(question['generation']);
    generation = questionViewModel.generation();
    phase = questionViewModel.phase();
    if (phase == 'writing' && generation > 1)
    {
        fetchWritingGraphs(generation);
    }
    else
    {
        fetchVotingGraphs();
    }
}

function fetchWritingGraphs(generation)
{
	console.log("fetchWritingGraphs called...")
	$.when(fetchGraph('pareto', generation-1)).done(function( graph_resp )
	{
		//if (typeof graph_resp[2].status !== 'undefined' && graph_resp[2].status == 204)
		if (false)
		{
		    $('.voting-graphs').hide();
		    console.log('fetchWritingGraphs: No endorsememnts yet');
		}
		else
		{
		    $('.voting-graphs').show();
			// a1 and a2 are arguments resolved for the page1 and page2 ajax requests, respectively.
			// Each argument is an array with the following structure: [ data, statusText, jqXHR ]
			console.log( "Pareto graph URL = " + graph_resp['url'] );
			pfvotesgraph = graph_resp['url'];
			//loadGraphs(null, pfvotesgraph);
			loadSingleGraph(pfvotesgraph);
		}
	}).fail(function(jqXHR) 
	{
		console.log('fetchWritingGraphs: There was an error fetching the graphs. Error ' + jqXHR.status);
    });
}

function fetchVotingGraphs()
{
	console.log("fetchGraphs called...")
	generation = questionViewModel.generation();
	$.when(fetchGraph('all', generation), fetchGraph('pareto', generation)).done(function( all, pareto )
	{
		if (all[2].status == 204)
		{
		    $('.voting-graphs').hide();
		    console.log('fetchVotingGraphs: No endorsememnts yet');
		}
		else
		{
		    $('.voting-graphs').show();
		    // a1 and a2 are arguments resolved for the page1 and page2 ajax requests, respectively.
			// Each argument is an array with the following structure: [ data, statusText, jqXHR ]
			console.log( "All votes graph URL = " + all[0]['url'] );
			console.log( "Pareto graph URL = " + pareto[0]['url'] );
			votesgraph = all[0]['url'];
			pfvotesgraph = pareto[0]['url'];
			loadGraphs(votesgraph, pfvotesgraph);
		}
	}).fail(function(jqXHR) 
	{
		console.log('fetchGraphs: There was an error fetching the graphs. Error ' + jqXHR.status);
    });
}



var ajaxRequest = function(uri, method, data) {
	console.log('ajaxRequest: request made... ' + uri);
	var request = {
		url: uri,
        type: method,
        contentType: "application/json",
        accepts: "application/json",
        cache: false,
        dataType: 'json',
        data: JSON.stringify(data),
        beforeSend: function (xhr) {
			if (currentUserViewModel.authToken != '')
			{
				console.log("Use the auth token " + currentUserViewModel.authToken);
				xhr.setRequestHeader('Authorization',
					"Basic " + btoa(currentUserViewModel.authToken + ":" + ''));
			}
			else if (currentUserViewModel.username() != '' && currentUserViewModel.password != '')
			{
				console.log("Use login details");
				xhr.setRequestHeader("Authorization", 
                	"Basic " + btoa(currentUserViewModel.username() + ":" + currentUserViewModel.password));
			}
        },
        error: function(jqXHR) {
            console.log("ajax error " + jqXHR.status);
        }
     };
     return $.ajax(request);
}
var ajaxRequest_xd = function(uri, method) {
	console.log('ajaxRequest: request made... ' + uri);
    var request = {
		url: uri,
        type: method,
        crossDomain: true,
        contentType: "application/json",
        accepts: "application/json",
        cache: false,
        dataType: 'jsonp',
        //data: JSON.stringify(data),
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", 
                "Basic " + btoa(self.username + ":" + self.password));
        },
        error: function(jqXHR) {
            console.log("ajax error " + jqXHR.status);
        }
     };
     return $.ajax(request);
   }
  
/*  
$(function() {
	currentUserViewModel = new CurrentUserViewModel();
	proposalsViewModel = new ProposalsViewModel();
    loginViewModel = new LoginViewModel();
	addProposalViewModel = new AddProposalViewModel();
	threeWayVoteViewModel = new ThreeWayVoteViewModel();
	viewProposalViewModel = new ViewProposalViewModel();
	newCommentViewModel = new NewCommentViewModel();
	
	initPage();

	ko.applyBindings(loginViewModel, $('#login')[0]);
	$(".proposals").each(function(){
	    ko.applyBindings(proposalsViewModel, $(this)[0]);
	});
	ko.applyBindings(viewProposalViewModel, $('#viewproposal #propdetails')[0]);
	//ko.applyBindings(viewProposalViewModel, $('#viewproposal #proposalcomments')[0]);
	ko.applyBindings(viewProposalViewModel, $('#viewproposal #showcomments')[0]);
	ko.applyBindings(viewProposalViewModel, $('#viewproposal #showquestions')[0]);
	ko.applyBindings(viewProposalViewModel, $('#viewproposal .vpheader')[0]);
	ko.applyBindings(newCommentViewModel, $('.newcommentpanel')[0]);
	ko.applyBindings(currentUserViewModel, $('.navbar')[0]);

	//$('.triangle').svg({onLoad: drawVotingTriangle});
	$('.triangle').hide();
	//$('.showtriangle').svg({onLoad: drawVotingTriangle});
	ko.applyBindings(threeWayVoteViewModel, $('#vote3waywindow')[0]);
	
	$('.votenow').on( "click", function(e) {
    	var posX = $(this).offset().left,
        posY = $(this).offset().top;
    	console.log((e.pageX - posX) + ' , ' + (e.pageY - posY));
	});

	$('#vote3waywindow').on('hidden.bs.modal', function () {
			console.log('vote3waywindow hidden...');
		$(this).find('.show3waytriangle').svg('destroy');
	});
	
	$('#viewproposal').on('hidden.bs.modal', function () {
			console.log('viewproposal hidden...');
		viewProposalViewModel.reset();
	});	
	$('#viewproposal').on('shown.bs.modal', function () {
		viewProposalViewModel.displayProposalContent();
	});
	
	
	$('body').popover({
	    selector: '[rel="popover"]',
		trigger: 'hover',
		html: true,
		placement: 'top',
		content: 'hello world',
		title: 'Add your vote',
		content: '<div class="poptriangle"></div>'
	});
	
	$('body').on('show.bs.popover', function () {
			console.log('popover displayed...');
	});
	$('body').on('hidden.bs.popover', function () {
			console.log('popover hidden...');
	});	
	
});	
*/

var enterShow = function() {
    console.log('enterShow')
	$(this).popover('show');
};

var exitHide = function() {
    $(this).popover('hide');
}
