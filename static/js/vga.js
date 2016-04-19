/****************************************************************************
#
# This file is part of the Vilfredo Client.
#
# Copyright © 2009-2015 Pietro Speroni di Fenizio / Derek Paterson.
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
console.log('Question = ' + question_id);

var pwdtoken = getQuerySegment('resetpwd');

var generation_id = parseInt(getQuerySegment('gen'));

var room = getQuerySegment('room');
console.log(room);


// Add function to delete all keys from Amplify storage if defined
if (typeof(amplify) != "undefined")
{
    amplify.clearStore = function() {
        $.each(amplify.store(), function (storeKey) {
            amplify.store(storeKey, null);
        });
    };
}

//var room = $.url().param('room') ? $.url().param('room') : '';
//var room = getQuerySegment('room');

var currentUserViewModel;
var proposalsViewModel;
var questionViewModel;
var viewProposalViewModel;
var loginViewModel;
var passwordResetViewModel;
var addProposalViewModel;
var editProposalViewModel;
var editQuestionViewModel;
var newQuestionViewModel;
var svggraph;
var userid = false;
var votesgraph;
var pfvotesgraph;
var triangle;
var permissionsViewModel;
var newPasswordViewModel;

var triangle_offset_x = 0;
var triangle_offset_y = 0;
var offset_x = 0;
var offset_y = 0;

// mouse move click prevent
(function($){
    var $doc = $(document),
        moved = false,
        pos = {x: null, y: null},
        abs = Math.abs,
        mclick = {
        'mousedown.mclick': function(e) {
            pos.x = e.pageX;
            pos.y = e.pageY;
            moved = false;
            //console.log("mousedown.mclick moved = " + moved);
        },
        'mouseup.mclick': function(e) {
            moved = abs(pos.x - e.pageX) > $.clickMouseMoved.threshold
                || abs(pos.y - e.pageY) > $.clickMouseMoved.threshold;
            //console.log("mouseup.mclick moved = " + moved);
        }
    };
    
    $doc.on(mclick);
    
    $.clickMouseMoved = function () {
        return moved;
    };
    
    $.clickMouseMoved.threshold = 3;
})(jQuery);

function scaleProposalImage(img)
{
	console.log('scaleProposalImage called...');
	var prop_image = $(img);
	prop_image.hide();
	var container = $(prop_image).parent('.proposal-blurb');
	if (container.length == 1)
	{
		container.css('padding', '0');
		var image = new Image();
		image.src = prop_image.attr('src');
		image.onload = function()
		{
		    var w = image.width;
		    var h = image.height;
    		var container_w = container.innerWidth();
    		var container_h = container.innerHeight();
    		var show_h, show_w;

    		if (container_w < container_h)
    		{
                show_h = container_w / w  * h;
                show_w = container_w;
    		}
    		else
    		{
    			show_w = container_h / h  * w;
                show_h = container_h;
    		}

    		prop_image
    			.width(show_w)
                .height(show_h)
                .show();
		};
	}
}


function scaleProposalImages()
{
    console.log('scaleProposalImages called...');
    $('.proposal-blurb').each(function() {
    	var container = $(this);
    	container.css('padding', '0');
    	var prop_image = $(this).find('img');
    	if (prop_image.length > 0)
    	{
    		var image = new Image();
    		image.src = prop_image.attr('src');
    		console.log('prop_image src ==> ' + prop_image.attr('src'));
    		var w = image.width;
    		var h = image.height;
    		var container_w = container.innerWidth();
    		var container_h = container.innerHeight();
		
    		console.log('w ==> ' + w);
    		console.log('h ==> ' + h);
		
    		console.log('container_w ==> ' + container_w);
    		console.log('container_h ==> ' + container_h);
    		
    		var show_h, show_w;
	
    		if (container_w < container_h)
    		{
                show_h = container_w / w  * h;
                show_w = container_w;
    		}
    		else
    		{
    			show_w = container_h / h  * w;
                show_h = container_h;
    		}

    		prop_image
    			.width(show_w)
                .height(show_h);
    	}
    });
}

function readURL(input) 
{
    if (input.files && input.files[0]) 
    {
        $('#avatar_placeholder').hide();
        var reader = new FileReader();
        var image  = new Image();
        
        reader.readAsDataURL(input.files[0]);
        reader.onload = function (_file) 
        {
            image.src    = _file.target.result;
            image.onload = function() 
            {
                var w = this.width;
                console.log('w = ' + w);
                var h = this.height;
                console.log('h = ' + h);
                var max = Math.max(w, h);
                console.log('max = ' + max);
                var show_w = w / max * 200;
                console.log('show_w = ' + show_w);
                var show_h = h / max * 200;
                console.log('show_h = ' + show_h);
        
                $('#selected_image')
                    .attr('src', image.src)
                    .width(show_w)
                    .height(show_h);
            };
        };
    }
}

function getVoteMapIconPath()
{
    var voting_type = (questionViewModel.voting_type()) ? questionViewModel.voting_type() : 1;
    if (voting_type == 2)
    {
    	return '/images/linear_map.svg';
    } 
    else
    {
    	return '/images/triangle_b.svg';
    }
}

function gotomain()
{
    window.location.replace(VILFREDO_URL);
}

// knockout html binding should do this
function convertNewlines(str)
{
    if (str != undefined)
    {
        if (/<[a-z][\s\S]*>/i.test(str))
        {
            // string has html paragraph tags so just return as is
            console.log("String has HTML tags. Returning unchanged.");
            return str;
        }
        else
        {
            // convert line breaks into html break tags
            console.log("Adding <b> HTML tags.");
            return str.replace(/\r?\n/g, '<br>');
        }
    }
    else
    {
        return 'No text found';
    }
}

function updateProgress(evt) 
{
    console.log('updateProgress');
    $('.progress').show();
    console.log('evt.lengthComputable = '+evt.lengthComputable);
    if (evt.lengthComputable) 
    {
            var percentComplete = evt.loaded / evt.total;
            $('.progress-bar').attr('width', percentComplete+'%');
            console.log(percentComplete);
    } else 
    {
            // Unable to compute progress information since the total size is unknown
            console.log('unable to complete');
            $('.progress-bar').attr('width', '100%');
    }
}

function displayCommentText(str, len) // king
{
    var len = (len == undefined) ? MAX_COMMENT_DISAPLAY_CHARS : len;
    return (str.length <= len) ? str : str.substr(0, len) + '...' + ' ( <a>read more</a> )';
}
function displayEmail(str, len) // king
{
    var len = (len == undefined) ? MAX_EMAIL_DISAPLAY_CHARS : len;
    var part_len = Math.round(len/2);
    return (str.length <= len) ? str : str.substr(0, part_len) + '...' + str.substr(str.length-part_len);
}
function displayUsername(str, len) // king
{
    var len = (len == undefined) ? MAX_USERNAME_DISAPLAY_CHARS : len;
    var part_len = Math.round(len/2);
    return (str.length <= len) ? str : str.substr(0, part_len) + '...' + str.substr(str.length-part_len);
}

function viewFullText(item)
{
    if (item.comment().length > MAX_COMMENT_DISAPLAY_CHARS)
    {
        $("#full_text .modal-body").html(item.comment().replace(/\r?\n/g, '<br>'));
        $("#full_text").modal('show');
    }
}

function get_api_info()
{
    var URI = VILFREDO_API +'/';
	return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) {
	    console.log('get_api_info: Success: Current API = ' + data.current_api_url);
	}).fail(function(jqXHR) {
        console.log('get_api_info: There was an error. Status ' + jqXHR.status);
    });
}

function SortByMedx(x, y) 
{
    return y.medx - x.medx; 
}

function sortProposalsByLike(left, right) 
{ 
    return left.mapx() == right.mapx() ? 0 : (left.mapx() < right.mapx() ? 1 : -1) 
}

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

function getJQXHRMessage(jqXHR, default_message)
{
    default_message = (default_message) ? default_message : 'There was a problem';
    var message = (jqXHR.responseJSON && jqXHR.responseJSON.message) ? jqXHR.responseJSON.message : default_message;
    return message;
}

function getJQXHRUserMessage(jqXHR, default_message)
{
    default_message = (default_message) ? default_message : 'There was a problem';
    var message = (jqXHR.responseJSON && jqXHR.responseJSON.user_message) ? jqXHR.responseJSON.user_message : getJQXHRMessage(jqXHR, default_message);
    return message;
}

function goto_question()
{
    window.location.replace(VILFREDO_URL+"/question/"+question_id);
}

function getJQXHRUserMessage(jqXHR, default_message)
{
    default_message = (default_message) ? default_message : 'There was a problem';
    var message = (jqXHR.responseJSON && jqXHR.responseJSON.user_message) ? jqXHR.responseJSON.user_message : default_message;
    return message;
}

function getItemIndexFromArrayWithID(itemArray, item_id)
{
    console.log("getItemIndexFromArrayWithID called with pid = " + item_id);
    return arrayFirstIndexOf(itemArray, function(item) {
       return item.id() === item_id;
    });
}

// Add show/hide custom event triggers
(function ($) 
{
  $.each(['show', 'hide'], function (i, ev) {
    var el = $.fn[ev];
    $.fn[ev] = function () {
      this.trigger(ev);
      return el.apply(this, arguments);
    };
  });
})(jQuery);

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

function checkForNewQuestion()
{
    console.log("checkForNewQuestion called... ");
    if ($.cookie('vganewquestion')) 
    {
        console.log("vganewquestion cookie found = " + $.cookie('vganewquestion'));
        if ($.cookie('vganewquestion') == questionViewModel.id() && questionViewModel.author_id() == currentUserViewModel.userid())
        {
            $.cookie('vganewquestion', null, { path: '/' });
            permissionsViewModel.open_permissions();
        }
    }
}

function checkVGAMessages()
{
    if ($.cookie('vgamessage'))
    {
    	var status = 'success';
    	if ($.cookie('vgastatus'))
    	{
    	    if ($.cookie('vgastatus') == 'error')
    	    {
    	        status = 'danger';
    	    }
    	    $.cookie('vgastatus', null, { path: '/' });
    	}
    	add_page_alert(status, $.cookie('vgamessage'));
    	$.cookie('vgamessage', null, { path: '/' });
    }
}

function getQuerySegment(variable)
{
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

// hellfire
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function setMapColorLinear(nx) 
{
    if (isNaN(nx))
    {
        //return "rgb(245,245,245)";
        return "#f5f5f5";
    }
    var col_max = 255;
    var G = Math.round(col_max * nx);
    var R = Math.round(col_max - G);
    var B = 0;
    //return "rgb(" + R + "," + G + "," + B + ")";
    return rgbToHex(R, G, B);
}
function setMapColor(nx, ny) 
{
    if (isNaN(nx) || isNaN(ny))
    {
        //return "rgb(245,245,245)";
        return "#f5f5f5";
    }
    var col_max = 255;
    var G = Math.round(col_max * nx);
    var R = Math.round(col_max - G);
    var B = Math.round(col_max * ny);
    //return "rgb(" + R + "," + G + "," + B + ")";
    return rgbToHex(R, G, B);
}

function getContrastYIQ(hexcolor){
	if(hexcolor.indexOf('#') !== -1)
    {
        hexcolor = hexcolor.substr(1);
    }
	var r = parseInt(hexcolor.substr(0,2),16);
	var g = parseInt(hexcolor.substr(2,2),16);
	var b = parseInt(hexcolor.substr(4,2),16);
	var yiq = ((r*299)+(g*587)+(b*114))/1000;
	return (yiq >= 128) ? 'black' : 'white';
}

// Add current vote to votemap
function setVoteLinear(proposal, dfd) // bosh
{
    console.log('setVote called...');
	var votemap = $('#modalvotesmap');
	var svg = $(votemap).svg('get');
	var dimensions = calculateLinearModalTriangleDimensions(svg);
    var max_x = dimensions.width;
    var max_y = dimensions.height;
	var votex = max_x * proposal.mapx(); 
	var votesgroup = $('.votes', svg.root());
    var fill_color = 'white';//setMapColorLinear(proposal.mapx());

	// If a vote is already plotted, move it
	var vote = $('.vote', svg.root()).filter(function() {
		return $(this).data("pid") == proposal.id();
	});
	
	console.log("setVoteLinear: num votes found = " + vote.length);

    if (vote.length > 0)
	{
		console.log("Moving existing vote");
		$(vote).attr('x1', votex).attr('x2', votex).attr('stroke', fill_color);
		$('.activelabel').attr('x', votex);
		dfd.resolve();
		//$(vote).animate({svgX1 : votex, svgX2 : votex, svgStroke: fill_color}, 1000);
	}
	else
    {
	    // Plot vote on votemap
		vote = svg.line(votesgroup, votex, LINEAR_MAP_OFFSET_Y, votex, LINEAR_MAP_OFFSET_Y + LINEAR_MAP_HEIGHT, {class: 'vote active draggable', stroke: fill_color, strokeWidth: LINEAR_MAP_VOTE_WIDTH, cursor: 'pointer', title: proposal.title()});

        $(vote).data('pid', proposal.id());
        $(vote).data('settings', {'pid': proposal.id()});
        
        // Add event handlers and mak draggable
        /*
        $(vote).on( "click", function(e) {
            console.log('click on vote');
            $(this).parent().siblings('#map').trigger(e);
        });
        $(vote).on( "mousemove", function(e) {
            $(this).parent().siblings('#map').trigger(e);
        });
        */
        // moon
        $(vote).on("mousedown", beginDraggingVoteLinear);
        $(vote).on("mouseup", voteAfterDragLinear);
        dfd.resolve();
    }
}

// Add current vote to votemap
function setVote(proposal, dfd) // strike
{
    console.log('setVote called...');
	var votemap = $('#modalvotesmap');
	var svg = $(votemap).svg('get');
	var dimensions = calculateModalTriangleDimensions(svg);
    var max_x = dimensions.width;
    var max_y = dimensions.height;
    /*
    var offset_x = 0, offset_y = 0;
    var offsets = votemap.find('#vote_map').data('offsets');
    if (typeof offsets != 'undefined')
    {
        offset_x = offsets.x;
        offset_y = offsets.y;
    }*/
    
	//max_x = $(svg._container).innerWidth();
	//console.log('container_width = ' + max_x);
    //max_y = 0.7 * max_x;
    //console.log('container_height = ' + max_y);

	var cx = (max_x * proposal.mapx()) + triangle_offset_x;
	var cy = (max_y * proposal.mapy()) + triangle_offset_y;

	var votesgroup = $('.votes', svg.root());
    var fill_color = setMapColor(proposal.mapx(), proposal.mapy());

	// If a vote is already plotted, move it
	var vote = $('.vote.active', svg.root()).filter(function() {
		return parseInt($(this).data("settings").pid) == parseInt(proposal.id());
	});
	
	console.log("*****************************");
	console.log("*****************************");
	console.log("SETVOTE: num votes found = " + vote.length);
	console.log("*****************************");
	console.log("*****************************");

    if (vote.length > 0)
	{
		console.log("Moving existing vote");
		$(vote).attr('cx', cx).attr('cy', cy).attr('fill', fill_color);
		dfd.resolve();
		/*
		$.when( $(vote).animate({svgCx : cx, svgCy : cy, svgFill: fill_color}, 500) ).done(function()
		{
		    dfd.resolve();
	    }); */
	}
	else
    {
	    //alert("VOTE NOT FOUND");
	    // Plot vote on votemap
    	vote = svg.circle(votesgroup, cx, cy, RADIUS+1, {class: 'vote active', fill: fill_color, cursor: 'pointer'});
        $(vote).data('pid', proposal.id());
        // Add event handlers and mak draggable
        $(vote).addClass('draggable');
        /*
        $(vote).on( "click", function(e) {
            console.log('click on vote');
            $(this).parent().siblings('#map').trigger(e);
        });
        $(vote).on( "mousemove", function(e) {
            $(this).parent().siblings('#map').trigger(e);
        });
        */
        // moon
        $(vote).on("mousedown", beginDraggingVote);
        $(vote).on("mouseup", voteAfterDrag);
        dfd.resolve();
    }
}

function addMedian(svg, pid, coords) // bang
{
    console.log("addMedian called for pid " + pid + " with dom_by " + coords['dominated_by']);
    
    var triangle = $('#results_triangle');
    if (triangle.length == 0) 
    {
        return;
    }
    
    var dimensions = calculateTriangleDimensions(svg);
    var container_width = dimensions.width;
    var container_height = dimensions.height;

    var g = $('#votes')[0];
    
    if (g.length == 0)
    {
        console.log("votes group not found");
        return;
    }
    
    if (!coords['median'])
    {
        return;
    }
    
    if (questionViewModel.results_pf_only() && coords['dominated_by'] != 0)
    {
        return;
    }
    
    console.log("pid is type " + typeof pid);

    var cx = container_width * coords['median'].medx;
    var cy = container_height * coords['median'].medy;

    //console.log("Draw result vote at (" + cx + ", " + cy +")");

    /*
    var med_fill, med_selected_fill_color;
    if  (coords['pareto'])
    {
        med_fill = MEDIAN_WINNER_COLOR;
        med_selected_fill_color = MEDIAN_WINNER_SELECTED_COLOR;
    }
    else
    {
        med_fill = MEDIAN_COLOR;
        med_selected_fill_color = MEDIAN_SELECTED_COLOR;
    }
    
    med_fill = MEDIAN_COLOR;
    med_selected_fill_color = MEDIAN_SELECTED_COLOR;
    */
    
    var title;
    var prop = proposalsViewModel.getProposal(pid);

    if (prop)
    {
         title = prop.title();
    }
    else
    {
        title = 'Proposal ID ' + pid
    }

    med = svg.circle(g, cx, cy, RADIUS+1, {class: 'med', title: title}); 
    $(med).data('settings', {'pid': pid});

    if (coords['pareto'] == 0)
    {
        $(med).addClass('pareto');
    }
    
    // Display proposal ID
    var txtx, txty;
    txtx = cx;
    if (cy < 30)
    {
        txty = cy + 25;
    }
    else
    {
        txty = cy - 20;
    }
    console.log("Draw med label at " + txtx + ", " + txty);
    var medlabel = svg.text(g, txtx, txty, String(pid));
    $(medlabel).data('settings', {'pid': parseInt(pid)}).addClass('medlabel');
    if (coords['pareto'])
    {
        $(medlabel).addClass('pareto');
    }

    /*
    var threshold_x = container_width*questionViewModel.mapx;
    var threshold_y = container_height*questionViewModel.mapy;
    var threshold = {'mapx': threshold_x, 'mapy': threshold_y};
    */

    $(med).on( "click", function(e) {
        console.log('click on median...');
        //e.stopPropagation();
        showProposalVotes(this, svg); // humbug
    });
    
    return $(med);
}


function addVote(svg, pid, coords, userid)
{
    console.log("addVote 2 called...");
    var triangle = $('#results_triangle');
    if (triangle.length == 0) 
    {
        return;
    }
    console.log("addVote called for pid " + pid);
    
    var dimensions = calculateTriangleDimensions(svg);
    var container_width = dimensions.width;
    var container_height = dimensions.height;

    g = $('#allvotes')[0];
    var fill_color = setMapColor(coords.voters[userid].mapx, coords.voters[userid].mapy);
    var med_selected_fill_color = MEDIAN_SELECTED_COLOR;

    cx = container_width * coords.voters[userid].mapx;
    cy = container_height * coords.voters[userid].mapy;
    
    medx = container_width * coords.median.medx;
    medy = container_height * coords.median.medy;
    
    // Remove existing med marker
    var med_marker = $('.med_marker', svg.root()).filter(function() {
    	return $(this).data("settings").pid == pid;
    });
	$(med_marker).remove();
    
    // Draw line to connect vote with median
    var medline = svg.line(g, cx, cy, medx, medy, {class: 'medline', strokeWidth: 1, stroke: fill_color});
    $(medline).data('settings', {'userid': userid, 'pid': pid});
    
    // Add marker over selected median
    var med_marker = svg.circle(g, medx, medy, RADIUS+1, {class: 'allvotes', fill: med_selected_fill_color, title: $(med).attr('title')});
    $(med_marker).data('settings', {'pid': pid}).addClass("med_marker");

    var vote = svg.circle(g, cx, cy, RADIUS+1, {class: 'allvotes', fill: fill_color, title: 'User ' + userid}); 
    $(vote).data('settings', {'userid': parseInt(userid), 'username': coords.voters[userid].username, 'pid': parseInt(pid)}).addClass('uservote');

    // harpo
    $(vote).on("click", function(e) {
        if ($.clickMouseMoved()) {
            console.log('vote click: click aborted 1');
            return;           
        }
        //e.stopPropagation();
        console.log('click on user vote... showUserVotes');
        showUserVotes(svg, userid, coords.voters[userid].username);
    })
    
    if (questionViewModel.phase() == 'voting' && questionViewModel.completed_voter_count() >= RESULTS_VOTING_MIN_VOTERS && userid == currentUserViewModel.userid())
    {
        console.log("Make draggable for user id " + userid);
        $(vote).addClass('draggable').addClass('vote');
        $(vote).on("mousedown", beginDraggingVoteResults);
        $(vote).on("mouseup", voteAfterDragResults);
    }

    // Display username
    var txtx, txty;
    if (cx < 30)
    {
        txtx = cx + 25;
    }
    else
    {
        txtx = cx - 20;
    }
    if (cy < 30)
    {
        txty = cy + 25;
    }
    else
    {
        txty = cy - 20;
    }
    var vote_label = svg.text(g, txtx, txty, coords.voters[userid].username);  // rel="popover" 
    $(vote_label).data('settings', {'userid': parseInt(userid), 'username': coords.voters[userid].username, 'pid': parseInt(pid)}).addClass('vote_label');
}

function showUserVotesLinear(clicked, svg, userid, username) // lanister
{
    console.log("showUserVotesLinear called for user " + userid);
    
    var triangle = $('#results_triangle');
    if (triangle.length == 0) 
    {
        return;
    }
    var settings = {'mode': 'showUserVotes', 'userid': parseInt(userid)};
    triangle.data('settings', settings);
    
    $('.med', svg.root()).removeClass('selected').addClass('hidden');
    $('.medlabel', svg.root()).addClass('hidden');
    
    var dimensions = calculateTriangleDimensions(svg);
    var container_width = dimensions.width;
    
    $('#allvotes', svg.root()).remove();
    var resultsmap = $('#resultsmap')[0];
    var g = svg.group(resultsmap, 'alluservotes');
    
    var fill_color;
    var votex = parseInt($(clicked).attr('x1'));
    
    var y1 = LINEAR_RESULTS_MAP_OFFSET_Y;
    var y2 = LINEAR_RESULTS_MAP_OFFSET_Y + LINEAR_MAP_HEIGHT;

    // Display username
    var txtx = container_width / 2;
    var txty = LINEAR_RESULTS_MAP_OFFSET_Y + LINEAR_MAP_HEIGHT + 50;
    var label_text = "All " + username + "'s votes";
    var user_votes_label = svg.text(g, txtx, txty, label_text);
    $(user_votes_label).data('settings', {'userid': parseInt(userid), 'username': username}).addClass('user_votes_label');

    jQuery.each(questionViewModel.voting_data, function(pid, coords) 
    {
        if (typeof coords['voters'][parseInt(userid)] == 'undefined') // tyrion
        {
            console.log("vote not found");
            return true;
        }
        
        var votex = container_width * coords['voters'][parseInt(userid)]['mapx'];
        var stroke_color = 'white';//setMapColorLinear(coords['voters'][parseInt(userid)]['mapx']);

        var prop_title;
        var prop = proposalsViewModel.getProposal(pid);

        if (prop)
        {
             prop_title = prop.title();
        }
        else
        {
            prop_title = 'Proposal ID ' + pid
        }

        var vote = svg.line(g, votex, y1, votex, y2, {class: 'alluservotes', stroke: stroke_color, strokeWidth: LINEAR_MAP_VOTE_WIDTH, cursor: 'pointr', title: prop_title});
        $(vote).data('settings', {'userid': parseInt(userid), 'username': username, 'pid': parseInt(pid)}).addClass('uservote');
        
        // Display proposal ID
        var txtx = votex;
        var txty = LINEAR_RESULTS_MAP_OFFSET_Y - 20;
        var label = svg.text(g, txtx, txty, String(pid));
        $(label).data('settings', {'pid': pid, 'userid': userid, 'username': username}).addClass('vote_label');
        
        /*
        $(vote).on( "click", function(e) {
            //e.stopPropagation();
            var pid = $(this).data('settings').pid;
            var med = $('.med').filter(function() {
                return parseInt($(this).data('pid')) === pid;
            });
            
            if (med.length == 1)
            {
                med.show();
                showProposalVotesLinear(med, svg);
            }
        }); */
        
        if (questionViewModel.phase() == 'voting' && questionViewModel.completed_voter_count() >= RESULTS_VOTING_MIN_VOTERS && userid == currentUserViewModel.userid())
        {
            console.log("Make draggable for user id " + userid);
            $(vote).addClass('draggable').addClass('vote');
            $(vote).on("mousedown", beginDraggingVoteResultsLinear);
            $(vote).on("mouseup", voteAfterDragResultsLinear);
        }
    });
}
function showProposalVotesLinear(med, svg) // lanister
{
    console.log("showProposalVotesLinear called...");
    var triangle = $('#results_triangle');
    if (triangle.length == 0) 
    {
        console.log("results_triangle not found");
        return;
    }
    var pid = $(med).data('settings').pid;
    var settings = {'mode': 'showProposalVotes', 'pid': pid};
    triangle.data('settings', settings);
    
    var dimensions = calculateTriangleDimensions(svg);
    var container_width = dimensions.width;

    $('#allvotes,#alluservotes').remove();
    
    $(med).addClass('selected');
    // Hide other medians
    var not_selected = $('.med', svg.root()).filter(function() {
    	return $(this).hasClass("selected") == false;
    });
    console.log("Not selected length = " + not_selected.length);
    not_selected.hide();
    console.log("Add class hidden");
    not_selected.addClass('hidden');
    
    $('.medlabel', svg.root()).filter(function() {
    	return $(this).data("settings").pid != pid;
    }).addClass('hidden');
    
    var voters = questionViewModel.voting_data[pid].voters;
    var g = svg.group(resultsmap, 'allvotes');
    var stroke_color;
    var cursor_type;
    var y1 = LINEAR_RESULTS_MAP_OFFSET_Y;
    var y2 = LINEAR_RESULTS_MAP_OFFSET_Y+LINEAR_MAP_HEIGHT;

    jQuery.each(voters, function(userid, coords) {
        userid = parseInt(userid);
        votex = container_width * coords.mapx;
        stroke_color = 'white';// setMapColorLinear(coords.mapx);
        cursor_type = (userid == currentUserViewModel.userid()) ? 'pointer' : 'arrow';

        var vote = svg.line(g, votex, y1, votex, y2, {class: 'vote allvotes', stroke: stroke_color, strokeWidth: LINEAR_MAP_VOTE_WIDTH, cursor: cursor_type, title: 'User ' + userid});
        $(vote).data('settings', {'userid': parseInt(userid), 'username': coords.username, 'pid': parseInt(pid)});

        $(vote).on("click", function(e) {
            if ($.clickMouseMoved()) {
                console.log('click aborted 2');
                return;           
            }
            //e.stopPropagation();
            console.log('click on user vote... showUserVotes');
            showUserVotesLinear(this, svg, userid, coords.username);
        })
        
        if (questionViewModel.phase() == 'voting' && questionViewModel.completed_voter_count() >= RESULTS_VOTING_MIN_VOTERS && userid == currentUserViewModel.userid())
        {
            console.log("Make draggable for user id " + userid);
            $(vote).addClass('draggable').addClass('vote');
            $(vote).on("mousedown", beginDraggingVoteResultsLinear);
            $(vote).on("mouseup", voteAfterDragResultsLinear);
        }

        // Display proposal ID
        var txtx = votex;
        var txty = LINEAR_RESULTS_MAP_OFFSET_Y + LINEAR_MAP_HEIGHT + 20;
        var label = svg.text(g, txtx, txty, coords.username);
        $(label).data('settings', {'pid': parseInt(pid), 'userid': userid}).addClass('vote_label');
    });
}

function showProposalVotes(med, svg) // loud
{
    var triangle = $('#results_triangle');
    if (triangle.length == 0) 
    {
        return;
    }
    var pid = $(med).data('settings').pid;
    var settings = {'mode': 'showProposalVotes', 'pid': pid};
    triangle.data('settings', settings);
    $(med).addClass('selected');
    
    var dimensions = calculateTriangleDimensions(svg);
    var container_width = dimensions.width;
    var container_height = dimensions.height;

    $('#allvotes,#alluservotes').remove();
    
    var voters = questionViewModel.voting_data[pid].voters;

    //threshold = {'mapx': container_width * questionViewModel.mapx, 'mapy': container_height * questionViewModel.mapy}
    //console.log("Threshold at (" + threshold.mapx + ", " + threshold.mapy +")");

    var resultsmap = $('#resultsmap')[0];
    var g = svg.group(resultsmap, 'allvotes'); 
    var fill_color;
    var med_selected_fill_color = MEDIAN_SELECTED_COLOR;
    var voter_count = getKeys(voters).length;
    //var draw_marker = voter_count != 1 && voter_count != 3;

    jQuery.each(voters, function(userid, coords) {
        userid = parseInt(userid);
        cx = container_width * coords.mapx;
        cy = container_height * coords.mapy;
        fill_color = setMapColor(coords.mapx, coords.mapy);

        // Draw line to connect vote with median
        var medline = svg.line(g, cx, cy, parseInt($(med).attr('cx')), parseInt($(med).attr('cy')), {class: 'medline', strokeWidth: 1, stroke: fill_color});
        $(medline).data('settings', {'userid': parseInt(userid), 'pid': $(med).data('settings').pid});
    });
    
    // Add marker over selected median if no vote lies on top
    /*
    if (true || draw_marker)
    {*/
        //alert("draw marker");
    // loud
    var med_marker = svg.circle(g, parseInt($(med).attr('cx')), parseInt($(med).attr('cy')), RADIUS+1, {class: 'allvotes', fill: med_selected_fill_color, title: $(med).attr('title')});
    $(med_marker).data('settings', {'pid': pid}).addClass("med_marker");
    
    if ($(med).hasClass('pareto'))
    {
        $(med_marker).addClass('pareto');
    }

    $(med_marker).on( "click", function(e) {
        //e.stopPropagation();
        $('#resultstriangle #allvotes, #resultstriangle #alluservotes').remove();
		var triangle = $('#results_triangle');
	    if (triangle.length == 1) 
	    {
	    	triangle.data('settings', {'mode': 'default'});
	    }
    });
    // }
    
    jQuery.each(voters, function(userid, coords) {
        userid = parseInt(userid);
        cx = container_width * coords.mapx;
        cy = container_height * coords.mapy;
        fill_color = setMapColor(coords.mapx, coords.mapy);

        // Draw line to connect vote with median
        /*
        var medline = svg.line(g, cx, cy, parseInt($(med).attr('cx')), parseInt($(med).attr('cy')), {class: 'medline', strokeWidth: 1, stroke: fill_color});
        $(medline).data('settings', {'userid': parseInt(userid), 'pid': $(med).data('settings').pid});
        */

        var vote = svg.circle(g, cx, cy, RADIUS+1, {class: 'allvotes', fill: fill_color, title: 'User ' + userid}); 
        $(vote).data('settings', {'userid': parseInt(userid), 'username': coords.username, 'pid': parseInt(pid)}).addClass('uservote');

        $(vote).on("click", function(e) {
            if ($.clickMouseMoved()) {
                console.log('click aborted 3');
                return;           
            }
            //e.stopPropagation();
            console.log('click on user vote... showUserVotes');
            showUserVotes(svg, userid, coords.username);
        })
        
        if (questionViewModel.phase() == 'voting' && questionViewModel.completed_voter_count() >= RESULTS_VOTING_MIN_VOTERS && userid == currentUserViewModel.userid())
        {
            console.log("Make draggable for user id " + userid);
            $(vote).addClass('draggable').addClass('vote');
            /*
            $(vote).on( "click", function(e) {
                if ($.clickMouseMoved()) {
                    console.log('click aborted');
                    return;           
                }
                console.log('click on vote');
                $(this).parent().siblings('#map').trigger(e);
            });
            
            $(vote).on("mousemove", function(e) {
                $(this).parent().siblings('#map').trigger(e);
            });
            */
            $(vote).on("mousedown", beginDraggingVoteResults);
            $(vote).on("mouseup", voteAfterDragResults);
        }

        // Display username
        var txtx, txty;
        if (cx < container_width - 55)
        {
            txtx = cx + 20;
        }
        else
        {
            txtx = cx - 30;
        }
        if (cy < container_height - 55)
        {
            txty = cy + 20;
        }
        else
        {
            txty = cy - 30;
        }
        var vote_label = svg.text(g, txtx, txty, coords.username);  // rel="popover" 
        $(vote_label).data('settings', {'userid': parseInt(userid), 'username': coords.username, 'pid': parseInt(pid)}).addClass('vote_label');
    });
}

function showUserVotes(svg, userid, username)
{
    console.log("showUserVotes called for user " + userid);
    
    var triangle = $('#results_triangle');
    if (triangle.length == 0) 
    {
        return;
    }
    var settings = {'mode': 'showUserVotes', 'userid': parseInt(userid)};
    triangle.data('settings', settings);
    
    $('#allvotes', svg.root()).remove();
    var resultsmap = $('#resultsmap')[0];
    var g = svg.group(resultsmap, 'alluservotes');
    
    var dimensions = calculateTriangleDimensions(svg); // helium
    var container_width = dimensions.width;
    var container_height = dimensions.height;
    var fill_color;

    // Display all user votes title
    var txtx = container_width - container_width/5; 
    var txty = container_height/2;
    var label_text = "All " + username + "'s votes";
    var user_votes_label = svg.text(g, txtx, txty, label_text, {fontSize: '1.3em'});
    $(user_votes_label).data('settings', {'userid': parseInt(userid), 'username': username}).addClass('user_votes_label');

    //var med_selected_fill_color = MEDIAN_SELECTED_COLOR;

    // snow
    //var container_width = $(svg._container).innerWidth();
    //var container_height = 0.7 * container_width;


    jQuery.each(questionViewModel.voting_data, function(pid, coords) {
        medx = container_width * coords['median']['medx'];
        medy = container_height * coords['median']['medy'];

        if (typeof coords['voters'][parseInt(userid)] == 'undefined')
        {
            console.log("vote not found");
            return true;
        }
        
        var voter_count = getKeys(coords.voters).length;
        var draw_marker = voter_count != 1 && voter_count != 3;
        console.log("showUserVotes: coords.voters.length = " + voter_count);
        console.log("showUserVotes: draw_marker = " + draw_marker);
        
        cx = container_width * coords['voters'][parseInt(userid)]['mapx'];
        cy = container_height * coords['voters'][parseInt(userid)]['mapy'];

        fill_color = setMapColor(coords['voters'][parseInt(userid)]['mapx'], coords['voters'][parseInt(userid)]['mapy']);

        // Draw line to connect vote with median
        var medline = svg.line(g, cx, cy, medx, medy, {strokeWidth: 1, stroke: fill_color});
        $(medline).data('settings', {'userid': parseInt(userid), 'pid': parseInt(pid)}).addClass('medline');

        var prop_title;
        var prop = proposalsViewModel.getProposal(pid);

        if (prop)
        {
             prop_title = prop.title();
        }
        else
        {
            prop_title = 'Proposal ID ' + pid
        }

        /*
        var med = svg.circle(g, medx, medy, RADIUS+1, {fill: med_selected_fill_color, title: prop_title});
        $(med).on( "click", function(e) {
            showProposalVotes(this, svg);
        });*/
        
        /*
        if (draw_marker)
        {*/
            var med_marker = svg.circle(g, medx, medy, RADIUS+1, {title: prop_title});
            $(med_marker).data('settings', {'pid': pid}).addClass("med_marker");
    		{
    		    $(med_marker).on( "click", function(e) {
                    //e.stopPropagation();
                    $('#resultstriangle #allvotes, #resultstriangle #alluservotes').remove();
            		var triangle = $('#results_triangle');
            	    if (triangle.length == 1) 
            	    {
            	    	triangle.data('settings', {'mode': 'default'});
            	    }
                });
            }
       // }
        
        //console.log("Create vote at " + cx + ', ' + cy);
        vote = svg.circle(g, cx, cy, RADIUS+1, {class: 'alluservotes', fill: fill_color, title: 'User ' + userid}); 
        $(vote).data('userid', userid);
        $(vote).data('pid', pid);
        $(vote).data('settings', {'userid': parseInt(userid), 'username': username, 'pid': parseInt(pid)}).addClass('uservote');

        $(vote).on( "click", function(e) {
            if ($.clickMouseMoved()) {
                console.log('click aborted 4');
                return;
            }
            //e.stopPropagation();
            var pid = parseInt($(this).data('pid'));
            var med = $('.med').filter(function() {
                return parseInt($(this).data('pid')) === pid;
            });

            if (med.length > 0)
            {
                showProposalVotes(med, svg);
            }
        });
        
        if (questionViewModel.phase() == 'voting' && questionViewModel.completed_voter_count() >= RESULTS_VOTING_MIN_VOTERS && userid == currentUserViewModel.userid())
        {
            console.log("Make draggable for user id " + userid);
            $(vote).addClass('draggable').addClass('vote');
            $(vote).on("mousedown", beginDraggingVoteResults);
            $(vote).on("mouseup", voteAfterDragResults);
        }

        /*
        var votex = parseInt($(vote).attr('cx'));
        var votey = parseInt($(vote).attr('cy'));

        // Display username
        var txtx, txty;
        if (votex < 30)
        {
            txtx = votex + 25;
        }
        else
        {
            txtx = votex - 20;
        }
        if (votey < 30)
        {
            txty = votey + 25;
        }
        else
        {
            txty = votey - 20;
        }
        svg.text(g, txtx, txty, coords.voters[parseInt(userid)].username);
        */
    });
}


// snow
function drawVoteNowTriangle(svg)
{
	var width = 200, height = 200;
	var path = svg.createPath();
	var triangle = svg.path(
	    path.move(0, 0)
	    .line( width/2, height, true )
	    .line( width/2, -height, true )
	    .close(),
	    {
	        fill: MEDIAN_WINNER_COLOR,
	        class: 'votenow'
	    }
	);
}



function resizeSingleGraph()
{
    console.log('resizeGraph called...');
    var svg = $('.singlegraph').svg('get');
    if (svg != null)
    {
        setGraphSize(svg);
    }
}
function resizeResultsMap()
{
    console.log('resizeResultsMap called...');
    
    if ($('#resultsmap').length == 0)
    {
        return;
    }
    
    //var results = $('#resultstriangle');
    $('#resultsmap').remove();
    var svg = $('#resultstriangle').svg('get');
    createResultsMap(svg);
}
function resizeVoteMap()
{
    console.log('resizeVoteMap called...');
    
    if ($('#modalvotesmap').length == 0)
    {
        return;
    }
    
    //var results = $('#resultstriangle');
    $('#votemap').remove();
    var svg = $('#modalvotesmap').svg('get');
    console.log(svg);
    if (svg != null)
    {
        if (questionViewModel.voting_type() == 1)
        {
            createVoteMap(svg);
        }
        else
        {
            createVoteMapLinear(svg);
        }
    }
}


// haha
function resetResultsMap()
{
    console.log('resetResultsMap called...');
    $.when(questionViewModel.fetchVotingData()).done(function()
    {
	    //var results = $('#resultstriangle');
	    $('#resultsmap').remove();
	    var svg = $('#resultstriangle').svg('get');
        createResultsMap(svg);        
    });
}


// hound
function redoResultsMap()
{
    console.log('redoResultsMap called...');
    $.when(questionViewModel.fetchVotingData()).done(function()
    {
	    if ($('#resultsmap').length)
	    {
	        console.log("redoResultsMap: call updateResultsMap...");
	        updateResultsMap();
	    }
	    else
	    {
	        $('#resultstriangle').svg({onLoad: createResultsMap});
	    }
    });
}

function calculateModalCanvasDimensions(svg) // bosh
{
    // set height of results triangle container based on available space
	//var set_results_map_height = $(window).height() - $('.navbar').outerHeight();
    //$('#resultstriangle').height(set_results_map_height);

	//console.log('********* Start calculateTriangleDimensions *********');
	
	var map_width, map_height;
	
	/*
	if (questionViewModel.voting_type() == 2)
    {
    	triangle_offset_x = 20;
    	triangle_offset_y = 205;
    }*/

	var container_width = $(svg._container).innerWidth();
	var container_height = $(svg._container).innerHeight();
	//console.log('container_width = ' + container_width);
    //console.log('container_height = ' + container_height);
    
    
    if (questionViewModel.voting_type() == 2)
    {
        triangle_offset_x = 0;
    	triangle_offset_y = 220;
        
        return {'width' : container_width, 'height' : 41};
    }

	var ideal_width = map_width = container_width;
	var ideal_height = map_height = 0.7 * container_width;
	//console.log('ideal_height = ' + ideal_height);

    if (container_height < ideal_height)
    {
        console.log('calculateTriangleDimensions: container_height < ideal_height');
        map_width = container_height / 0.7;
        map_height = container_height;
    }
    else
    {
        console.log('calculateTriangleDimensions: container_height >= ideal_height');
        map_width = ideal_width;
        map_height = ideal_height;
    }
    
    //console.log('map_width = ' + map_width);
	//console.log('map_height = ' + map_height);
	//console.log('********* Completed calculateTriangleDimensions *********');

    return {'width' : map_width, 'height' : map_height};
}

function calculateLinearModalTriangleDimensions(svg) // bosh
{
    var map_width, map_height;
	
	/*
	if (questionViewModel.voting_type() == 2)
    {
    	triangle_offset_x = 20;
    	triangle_offset_y = 205;
    }*/

	var container_width = $(svg._container).innerWidth();
	var container_height = $(svg._container).innerHeight();
	//console.log('container_width = ' + container_width);
    //console.log('container_height = ' + container_height);
    
    triangle_offset_x = 0;
	triangle_offset_y = 220;
    
    return {'width' : container_width, 'height' : LINEAR_MAP_HEIGHT};
}

function calculateModalTriangleDimensions(svg) // bosh
{
    // set height of results triangle container based on available space
	//var set_results_map_height = $(window).height() - $('.navbar').outerHeight();
    //$('#resultstriangle').height(set_results_map_height);

	//console.log('********* Start calculateTriangleDimensions *********');
	
	var map_width, map_height;
	
	/*
	if (questionViewModel.voting_type() == 2)
    {
    	triangle_offset_x = 20;
    	triangle_offset_y = 205;
    }*/

	var container_width = $(svg._container).innerWidth();
	var container_height = $(svg._container).innerHeight();
	//console.log('container_width = ' + container_width);
    //console.log('container_height = ' + container_height);
    
    
    if (questionViewModel.voting_type() == 2)
    {
        triangle_offset_x = 0;
    	triangle_offset_y = 220;
        
        return {'width' : container_width, 'height' : 41};
    }

	var ideal_width = map_width = container_width;
	var ideal_height = map_height = 0.7 * container_width;
	//console.log('ideal_height = ' + ideal_height);

    if (container_height < ideal_height)
    {
        console.log('calculateTriangleDimensions: container_height < ideal_height');
        map_width = container_height / 0.7;
        map_height = container_height;
    }
    else
    {
        console.log('calculateTriangleDimensions: container_height >= ideal_height');
        map_width = ideal_width;
        map_height = ideal_height;
    }
    
    //console.log('map_width = ' + map_width);
	//console.log('map_height = ' + map_height);
	//console.log('********* Completed calculateTriangleDimensions *********');

    return {'width' : map_width, 'height' : map_height};
}

function calculateTriangleDimensions(svg) // bosh
{
    // set height of results triangle container based on available space
	//var set_results_map_height = $(window).height() - $('.navbar').outerHeight();
    //$('#resultstriangle').height(set_results_map_height);

	//console.log('********* Start calculateTriangleDimensions *********');
	
	var map_width, map_height;

	var container_width = $(svg._container).innerWidth();
	var container_height = $(svg._container).innerHeight() - 10;
	//console.log('container_width = ' + container_width);
    //console.log('container_height = ' + container_height);
    
    if (questionViewModel.voting_type() == 2)
    {
        triangle_offset_x = 0;
    	triangle_offset_y = 220;
        
        return {'width' : container_width, 'height' : 41};
    }

	var ideal_width = map_width = container_width;
	var ideal_height = map_height = 0.7 * container_width;
	//console.log('ideal_height = ' + ideal_height);

    if (container_height < ideal_height)
    {
        console.log('calculateTriangleDimensions: container_height < ideal_height');
        map_width = container_height / 0.7;
        map_height = container_height;
    }
    else
    {
        console.log('calculateTriangleDimensions: container_height >= ideal_height');
        map_width = ideal_width;
        map_height = ideal_height;
    }
    
    //console.log('map_width = ' + map_width);
	//console.log('map_height = ' + map_height);
	//console.log('********* Completed calculateTriangleDimensions *********');

    return {'width' : map_width, 'height' : map_height};
}

// haha
function updateVote(vote, svg, cx, cy, fill_color)
{
	console.log("updateVote called...");
	
	// Check if Vote unchanged
	if (parseInt(vote.attr("cx")) == cx && parseInt(vote.attr("cy")) == cy)
	{
	    console.log("updateVote: Vote unchanged");
	    return;
	}
	
	//var pid = vote.data('pid');
	//var userid = vote.data('userid');
	var pid = vote.data('settings').pid;
	var userid = vote.data('settings').userid;
	
	vote.animate({svgCx : cx, svgCy : cy, svgFill: fill_color}, 1000);
	// medlines
	var medline = $('.medline', svg.root()).filter(function() {
		return $(this).data("settings").pid == pid && $(this).data("settings").userid == userid;
	});
	if (medline.length == 1)
	{
	    medline.animate({svgX1 : cx, svgY1 : cy, svgStroke: fill_color}, 1000);
    }
    else
    {
        console.log("updateVote: medline not found");
    }
    
	// vote label
	var txtx, txty;
    txtx = cx;
    if (cy < 30)
    {
        txty = cy + 25;
    }
    else
    {
        txty = cy - 20;
    }
	var vote_label = $('.vote_label', svg.root()).filter(function() {
    	return $(this).data("settings").pid == pid && $(this).data("settings").userid == userid;
    });
	vote_label.animate({svgX : txtx, svgY : txty}, 1000);
}

function updateVoteLinear(vote, svg, votex) // lanister
{
	console.log("*********************************");
	console.log("updateVoteLinear called...");
	console.log("*********************************");
	var pid = vote.data('settings').pid;
	var userid = vote.data('settings').userid;
	console.log("updateVoteLinear: Update vote pid " + pid + " for user " + userid);
	
	vote.animate({svgX1 : votex, svgX2 : votex}, 1000);
	
	// vote label
    var txtx = votex;
	var vote_label = $('.vote_label', svg.root()).filter(function() {
    	return $(this).data("settings").pid == pid && $(this).data("settings").userid == userid;
    });
    console.log("updateVoteLinear: " + vote_label.length + " labels found");
	vote_label.animate({svgX : txtx}, 1000);
}

function updateMedianLinear(med, svg, medx, pareto) // lanister
{
	console.log("updateMedianLinear called...");
	/*
	var med_fill;
    if  (med.data('settings').pareto)
    {
        med_fill = MEDIAN_WINNER_COLOR;
    }
    else
    {
        med_fill = MEDIAN_COLOR;
    }
    med_fill = MEDIAN_COLOR;
    */
        
    if (pareto)
	{
	    $(med).addClass('pareto');
	}
	else
	{
	    $(med).removeClass('pareto');
	}
	
	// median
	// Check if Median unchanged
	/*
	if (parseInt(med.attr("x1")) == medx)
	{
	    console.log("updateMedian: Median unchanged");
	    return;
	}*/
	
	var pid = $(med).data('settings').pid;
	
	$(med).animate({svgX1 : medx, svgX2 : medx}, 1000);
		
	// median label
	var txtx = medx;
	var medlabel = $('.medlabel', svg.root()).filter(function() {
		return $(this).data("settings").pid == pid;
	});
	medlabel.animate({svgX : txtx}, 1000);
}

function updateMedian(med, svg, cx, cy, pareto) // loud
{
	console.log("updateMedian called...");
	
	if (pareto)
	{
	    med.addClass('pareto');
	}
	else
	{
	    med.removeClass('pareto');
	}
	
	var med_fill, med_selected_fill_color;
    if  (med.data('settings').pareto)
    {
        med_fill = MEDIAN_WINNER_COLOR;
        med_selected_fill_color = MEDIAN_WINNER_SELECTED_COLOR;
    }
    else
    {
        med_fill = MEDIAN_COLOR;
        med_selected_fill_color = MEDIAN_SELECTED_COLOR;
    }
    
    med_fill = MEDIAN_WINNER_COLOR;
    med_selected_fill_color = MEDIAN_WINNER_SELECTED_COLOR;
	
	// median
	// Check if Median unchanged
	if (parseInt(med.attr("cx")) == cx && parseInt(med.attr("cy")) == cy)
	{
	    console.log("updateMedian: Median unchanged");
	    return;
	}
	
	//var pid = parseInt($(med).data('pid'));
	var pid = $(med).data('settings').pid;
	
	$(med).animate({svgCx : cx, svgCy : cy}, 1000);
		
	// medlines
	var medlines = $('.medline', svg.root()).filter(function() {
		return $(this).data("settings").pid == pid;
	});
	$(medlines).animate({svgX2 : cx, svgY2 : cy}, 1000);
	// median label
	var txtx, txty;
    txtx = cx;
    if (cy < 30)
    {
        txty = cy + 25;
    }
    else
    {
        txty = cy - 20;
    }
	var medlabel = $('.medlabel', svg.root()).filter(function() {
		return $(this).data("settings").pid == pid;
	});
	medlabel.animate({svgX : txtx, svgY : txty}, 1000);
	
	var med_marker = $('.med_marker', svg.root()).filter(function() {
    	return $(this).data("settings").pid == pid;
    });
    if (med_marker.length == 0)
    {
        console.log("updateMedian: med_marker " + pid + " not found!!!");
    }
    
    if (pareto)
	{
	    med_marker.addClass('pareto');
	}
	else
	{
	    med_marker.removeClass('pareto');
	}
	
    $(med_marker).animate({svgCx : cx, svgCy : cy}, 1000);
}

function updateResultsMap() // bang
{
    console.log("updateResultsMap called...");
    if (questionViewModel.voting_type() == 2)
    {
        updateResultsMapLinear();
    }
    else
    {
        updateResultsMap2D();
    }
}
function updateResultsMapLinear() // lanister
{
    console.log("updateResultsMapLinear called...");
    var triangle = $('#results_triangle');
    if (triangle.length == 0) 
    {
        console.log("updateResultsMapLinear: results triangle not found");
        return;
    }

    if (triangle.data('settings') == 'undefined')
    {
        console.log("triangle.data('settings') NOT DEFINED!!!");
        //alert("triangle.data('settings') NOT DEFINED!!!");
        return;
    }

    var svg = $('#resultstriangle').svg('get');
    var dimensions = calculateTriangleDimensions(svg);
    var container_width = dimensions.width;

    $.each(questionViewModel.voting_data, function(pid, coords) 
    {
        //console.log("LOOP 1: pid = " + pid + " coords.median.medx = " + coords.median.medx);
        //console.log("*****> pid variable is of type " + typeof pid);
        pid = parseInt(pid);
        //console.log("*****> pid variable is of type " + typeof pid);
        if (!coords['median'])
        {
            return;
        }
        
        if (questionViewModel.results_pf_only() && coords['dominated_by'] != 0)
        {
            return;
        }
        
        var med = $('.med', svg.root()).filter(function() {  
        	return $(this).data("settings").pid == pid;
        });
        
        if (med.length == 0)
        {
            console.log("updateResultsMap: med not found for pid " + pid);
            med = addMedianLinear(svg, pid, coords);
            //return;
        }
        else
        {
            var medx = container_width * coords['median'].medx;
            updateMedianLinear($(med), svg, medx, coords['pareto']);
        }

        if (triangle.data('settings').mode == 'showProposalVotes' && pid == triangle.data('settings').pid)
        {
            console.log("updateResultsMap: mode == showProposalVotes for pid " + pid);
            $.each(coords.voters, function(userid, userdata) {
                console.log("LOOP 2: userid = " + userid + " userdata.username = " + userdata.username);
                userid = parseInt(userid);
                //console.log("*****> userid variable is of type " + typeof userid);

                if (isNaN(userdata.mapx) || isNaN(userdata.mapy))
                {
                    console.log("updateResultsMap: user " + userid + " not voted - skip... " + userdata.mapx);
                    return;
                }
        		var votex = container_width * userdata.mapx;
        		var stroke_color = setMapColorLinear(userdata.mapx);
                var vote = $('.vote', svg.root()).filter(function() {
                	return $(this).data("settings").pid == pid && $(this).data("settings").userid == userid;
                });
            
                if (vote.length == 1)
                {
                    console.log("********>>> Update vote pid " + pid + " for user " + userid);
                    updateVoteLinear($(vote), svg, votex);/////
                }
                else
                {
                    console.log("******** Vote pid " + pid + " for user " + userid + " NOT FOUND");
                    addVoteLinear(svg, pid, userid, userdata);////
                }
            });
        }
        else if (triangle.data('settings').mode == 'showUserVotes')
        {
            var userid = triangle.data('settings').userid;
            console.log("updateResultsMap: mode == showUserVotes for userid " + userid + ", pid = " + pid);
            var userdata = coords.voters[userid];
    		var votex = container_width * coords.voters[userid].mapx;
    		var stroke_color = setMapColorLinear(coords.voters[userid].mapx);
            var vote = $('.uservote', svg.root()).filter(function() {
            	return $(this).data("settings").pid == pid && $(this).data("settings").userid == userid;
            });
            if (vote.length == 1)
            {
                updateVoteLinear($(vote), svg, votex);////
            }
            else
            {
                console.log("Vote for " + pid + " not found!");
            }
        }
    });
}

function updateResultsMap2D() // loud
{
    var triangle = $('#results_triangle');
    if (triangle.length == 0) 
    {
        console.log("updateResultsMap: results triangle not found");
        return;
    }
    
    if (triangle.data('settings') == 'undefined')
    {
        console.log("triangle.data('settings') NOT DEFINED!!!");
        //alert("triangle.data('settings') NOT DEFINED!!!");
        return;
    }

    var svg = $('#resultstriangle').svg('get');
    var dimensions = calculateTriangleDimensions(svg);
    var container_width = dimensions.width;
    var container_height = dimensions.height;
    
    /*
    var coords = questionViewModel.voting_data[pid];
    var user_vote = questionViewModel.voting_data[pid].voters[userid];
    var voters = questionViewModel.voting_data[pid].voters;
    
    addVote(med, svg, userid, coords);
    */

    $.each(questionViewModel.voting_data, function(pid, coords) {
        console.log("LOOP 1: pid = " + pid + " coords.median.medx = " + coords.median.medx);
        //console.log("*****> pid variable is of type " + typeof pid);
        pid = parseInt(pid);
        //console.log("*****> pid variable is of type " + typeof pid);
        if (!coords['median'])
        {
            return;
        }
        
        if (questionViewModel.results_pf_only() && coords['dominated_by'] != 0)
        {
            return;
        }
        
        var med = $('.med', svg.root()).filter(function() {  
        	return $(this).data("settings").pid == pid;
        });
        
        if (med.length == 0)
        {
            console.log("updateResultsMap: med not found for pid " + pid);
            med = addMedian(svg, pid, coords);
            //return;
        }
        else
        {
            
            var med_cx = container_width * coords['median'].medx;
            var med_cy = container_height * coords['median'].medy;
            updateMedian($(med), svg, med_cx, med_cy, coords['pareto']); // loud
        }

        if (triangle.data('settings').mode == 'showProposalVotes' && pid == triangle.data('settings').pid)
        {
            console.log("updateResultsMap: mode == showProposalVotes for pid " + pid);
            $.each(coords.voters, function(userid, userdata) {
                console.log("LOOP 2: userid = " + userid + " userdata.username = " + userdata.username);
                userid = parseInt(userid);
                //console.log("*****> userid variable is of type " + typeof userid);

                if (isNaN(userdata.mapx) || isNaN(userdata.mapy))
                {
                    console.log("updateResultsMap: user " + userid + " not voted - skip... " + userdata.mapx);
                    return;
                }
                var fill_color = setMapColor(userdata.mapx, userdata.mapy);
                console.log("user " + userid + " fill_color: " + fill_color);
        		var cx = container_width * userdata.mapx;
                var cy = container_height * userdata.mapy;
                var vote = $('.uservote', svg.root()).filter(function() {
                	return $(this).data("settings").pid == pid && $(this).data("settings").userid == userid;
                });
            
                if (vote.length == 1)
                {
                    console.log("Update vote pid " + pid + " for user " + userid);
                    updateVote($(vote), svg, cx, cy, fill_color);
                }
                else
                {
                    //addVote($(med), svg, userid, userdata);
                    addVote(svg, pid, coords, userid);
                }
            });
        }
        else if (triangle.data('settings').mode == 'showUserVotes')
        {
            var userid = triangle.data('settings').userid;
            console.log("updateResultsMap: mode == showUserVotes for userid " + userid);
            var userdata = coords.voters[userid];
            var fill_color = setMapColor(userdata.mapx, userdata.mapy);
    		var cx = container_width * userdata.mapx;
            var cy = container_height * userdata.mapy;
            var vote = $('.uservote', svg.root()).filter(function() {
            	return $(this).data("settings").pid == pid && $(this).data("settings").userid == userid;
            });
            if (vote.length == 1)
            {
                updateVote($(vote), svg, cx, cy, fill_color);
            }
            else
            {
                //addVote(pid, svg, userid, userdata);
                addVote(svg, pid, coords, userid);
            }
        }
        //updateMedian($(med), svg, med_cx, med_cy);
    });
}

function resultsShowMediansOnly()
{
    var triangle = $('#results_triangle');
    if (triangle.length == 0) 
    {
        return;
    }
    
    if (questionViewModel.voting_type() == 1)
    {
        $('#resultstriangle #allvotes, #resultstriangle #alluservotes').remove();
    }
    else // linear
    {
        $('#resultstriangle #allvotes, #resultstriangle #alluservotes').remove();
        $('#resultstriangle .med, #resultstriangle .medlabel').removeClass('selected').show().removeClass('hidden');
    }
}

function addVoteLinear(svg, pid, userid, coords) // lanister
{
    var dimensions = calculateTriangleDimensions(svg);
    var container_width = dimensions.width;
    var g = svg.group(resultsmap, 'allvotes');
    var votex = container_width * coords.mapx;
    var y1 = LINEAR_RESULTS_MAP_OFFSET_Y;
    var y2 = LINEAR_RESULTS_MAP_OFFSET_Y+LINEAR_MAP_HEIGHT;
    var stroke_color = setMapColorLinear(coords.mapx);
    var cursor_type = (userid == currentUserViewModel.userid()) ? 'pointer' : 'arrow';
    var vote = svg.line(g, votex, y1, votex, y2, {class: 'allvotes', stroke: stroke_color, strokeWidth: LINEAR_MAP_VOTE_WIDTH, cursor: cursor_type, title: 'User ' + userid});
    $(vote).data('settings', {'userid': userid, 'username': coords.username, 'pid': pid});

    $(vote).on("click", function(e) {
        if ($.clickMouseMoved()) {
            console.log('click aborted 2');
            return;           
        }
        //e.stopPropagation();
        console.log('click on user vote...');
        showUserVotesLinear(this, svg, userid, coords.username);
    })
    
    if (questionViewModel.phase() == 'voting' && questionViewModel.completed_voter_count() >= RESULTS_VOTING_MIN_VOTERS && userid == currentUserViewModel.userid())
    {
        console.log("Make draggable for user id " + userid);
        $(vote).addClass('draggable').addClass('vote');
        $(vote).on("mousedown", beginDraggingVoteResultsLinear);
        $(vote).on("mouseup", voteAfterDragResultsLinear);
    }

    // Display proposal ID
    var txtx = votex;
    var txty = LINEAR_RESULTS_MAP_OFFSET_Y + LINEAR_MAP_HEIGHT + 20;
    var label = svg.text(g, txtx, txty, coords.username);
    $(label).data('settings', {'pid': parseInt(pid)}).addClass('vote_label');
}

function addMedianLinear(svg, pid, coords) // lanister
{
    var dimensions = calculateTriangleDimensions(svg);
    var triangle_width = dimensions.width;
    var medx = triangle_width * coords['median'].medx;
    var pareto = coords['pareto'];

    /*
    var med_fill, med_selected_fill_color;
    if  (pareto)
    {
        med_fill = MEDIAN_WINNER_COLOR;
        med_selected_fill_color = MEDIAN_WINNER_SELECTED_COLOR;
    }
    else
    {
        med_fill = MEDIAN_COLOR;
        med_selected_fill_color = MEDIAN_SELECTED_COLOR;
    } 

    med_fill = MEDIAN_COLOR;
    med_selected_fill_color = MEDIAN_SELECTED_COLOR;
    */

    var title;
    var prop = proposalsViewModel.getProposal(pid);
    if (prop)
    {
         title = prop.title();
    }
    else
    {
        title = 'Proposal ID ' + pid
    }

    var cursor_type = 'arrow';
    var y1 = LINEAR_RESULTS_MAP_OFFSET_Y;
    var y2 = LINEAR_RESULTS_MAP_OFFSET_Y+LINEAR_MAP_HEIGHT;
    
    var triangle = $('#results_triangle');
    var classes = "med";
        
    if (triangle.data('settings').mode == 'showUserVotes') 
    {
    	//addClass('hidden');
    	classes += 'hidden';
    }
    else if (triangle.data('settings').mode == 'showProposalVotes' &&  triangle.data('settings').pid != pid) 
    {
    	//addClass('hidden');
    	classes += 'hidden';
    }

    med = svg.line(g, medx, y1, medx, y2, {class: 'med', stroke: med_fill, strokeWidth: LINEAR_MAP_VOTE_WIDTH, cursor: cursor_type, title: title});

    $(med).data('settings', {'pid': parseInt(pid), 'pareto': pareto});

    if (pareto)
    {
        $(med).addClass('pareto');
    }

    // Display proposal ID
    var txtx = medx;
    var txty = LINEAR_RESULTS_MAP_OFFSET_Y - 20;
    var medlabel = svg.text(g, txtx, txty, String(pid));
    $(medlabel).data('settings', {'pid': parseInt(pid)}).addClass('medlabel');
    if (pareto)
    {
        $(medlabel).addClass('pareto');
    }

    $(med).on( "click", function(e) {
        console.log('click on median linear...');
        //e.stopPropagation();
        //showProposalVotesLinear(this, svg); // humbug
    });
    
    return med;
}

function createResultsMapLinear(svg) // lanister
{
	console.log('createResultsMapLinear called...');
	
	if (proposalsViewModel.votedAll() == false)
	{
	    console.log("User not finished voting: don't show results triengle.");
	}
	
	//console.log('createResultsMap called...');
	var container_width = $(svg._container).innerWidth();
	//console.log('container_width = ' + container_width);
    var container_height = 170;  //0.4 * container_width;
    //console.log('container_height = ' + container_height);
    resetSize(svg, container_width, container_height);
    
    // set height of results triangle container based on available space
	//var set_results_map_height = $(window).height() - $('.navbar').outerHeight();
    //$('#resultstriangle').height(set_results_map_height);

    var dimensions = calculateTriangleDimensions(svg);
    var triangle_width = dimensions.width;
    var triangle_height = dimensions.height;
    
    var defs = svg.defs();
    svg.linearGradient(defs, 'lineargradient', [[0, 'red', 1], [1, 'green', 1]], 0, 0, triangle_width, 0, {gradientUnits: 'userSpaceOnUse'}); 
    
    var resultsmap = svg.group('resultsmap');
	var path = svg.createPath();
    var map = svg.path(
            resultsmap,
            path.move(0, LINEAR_RESULTS_MAP_OFFSET_Y)
            .line( triangle_width, 0, true )
            .line( 0, triangle_height, true )
            .line( -triangle_width, 0, true )
            .close(),
            {
                fill: 'url(#lineargradient)',
                stroke: '#CDCDCD',
                strokeWidth: 2,
                id: 'results_triangle'
            }
        );
    //$(map).data('offsets', {'x': 0, 'y': 205});
    $(map).data('settings', {'mode': 'default'});
    $(map).on("mouseup", function(e)
    {
        console.log("triangle mouseup...");
        var dragged_vote = $('.vote.dragged');
        console.log(dragged_vote.length + " dragged_votes found...");
        console.log("Trigger mousup on dragged vote");
        if (dragged_vote.length == 1)
        {
            var event = jQuery.Event( "mouseup" );
            event.pageX = e.pageX;
            event.pageY = e.pageY;
            dragged_vote.trigger(e);
        }
    });
    
    // Add medians
    var g = svg.group(resultsmap, 'votes'); // mapgroup
    $.each(questionViewModel.voting_data, function(pid, coords) 
    {
        if (!coords['median'])
        {
            return;
        }
    
        if (questionViewModel.results_pf_only() && coords['dominated_by'] != 0)
        {
            return;
        }
    
        console.log("pid is type " + typeof pid);

        var medx = triangle_width * coords['median'].medx;
        //var pareto = coords['pareto'];
        var pareto = coords['pareto'];

        var med_fill, med_selected_fill_color;
        if  (pareto)
        {
            med_fill = MEDIAN_WINNER_COLOR;
            med_selected_fill_color = MEDIAN_WINNER_SELECTED_COLOR;
        }
        else
        {
            med_fill = MEDIAN_COLOR;
            med_selected_fill_color = MEDIAN_SELECTED_COLOR;
        }

        med_fill = MEDIAN_COLOR;
        med_selected_fill_color = MEDIAN_SELECTED_COLOR;

        var title;
        var prop = proposalsViewModel.getProposal(pid);
        if (prop)
        {
             title = prop.title();
        }
        else
        {
            title = 'Proposal ID ' + pid
        }

        var cursor_type = 'pointer';
        var y1 = LINEAR_RESULTS_MAP_OFFSET_Y;
        var y2 = LINEAR_RESULTS_MAP_OFFSET_Y + LINEAR_MAP_HEIGHT;

        med = svg.line(g, medx, y1, medx, y2, {class: 'med', strokeWidth: LINEAR_MAP_VOTE_WIDTH, cursor: cursor_type, title: title});
        if (pareto)
        {
            $(med).addClass('pareto');
        }
        $(med).data('settings', {'pid': parseInt(pid), 'pareto': pareto});

        // Display proposal ID
        var txtx = medx;
        var txty = LINEAR_RESULTS_MAP_OFFSET_Y - 20;
        var medlabel = svg.text(g, txtx, txty, String(pid));
        $(medlabel).data('settings', {'pid': parseInt(pid)}).addClass('medlabel');
        if (pareto)
        {
            $(medlabel).addClass('pareto');
        }

        $(med).on( "click", function(e) {
            console.log('click on median linear: showProposalVotesLinear....');
            //e.stopPropagation();
            showProposalVotesLinear(this, svg);
        });
    });
}

function createResultsMap(svg)
{
    if (questionViewModel.voting_type() == 1)
    {
        createResultsMap2D(svg);
    }
    else
    {
        createResultsMapLinear(svg);
    }
}

function createResultsMap2D(svg) // loud
{
	console.log('createResultsMap2D V2 called...');
	
	if (questionViewModel.phase() == 'voting' && proposalsViewModel.votedAll() == false)
	{
	    console.log("User not finished voting: don't show results triengle.");
	}
		
	//console.log('createResultsMap2D called...');
	var container_width = $(svg._container).innerWidth();
	//console.log('container_width = ' + container_width);
    var container_height = 0.7 * container_width;
    //console.log('container_height = ' + container_height);
    
    // set height of results triangle container based on available space
	var set_results_map_height = $(window).height() - $('.navbar').outerHeight();
    $('#resultstriangle').height(set_results_map_height);

    var dimensions = calculateTriangleDimensions(svg);
    var triangle_width = dimensions.width;
    var triangle_height = dimensions.height;

    var max_x = triangle_width;
    var max_y = triangle_height;
    var mid_x = triangle_width/2;
    var mid_y = triangle_height/2;

    var resultsmap = svg.group('resultsmap');

    resetSize(svg, container_width, container_height);

	var path = svg.createPath();
	var triangle;
	/*
    var triangle = svg.path(resultsmap,
        path.move(0, 0)
        .line( container_width/2, container_height, true )
        .line( container_width/2, -container_height, true )
        .close(),
        {
            fill: 'white',
            stroke: '#CDCDCD',
            strokeWidth: 2,
            id: 'results_triangle'
        }
    );*/

	triangle = svg.path(resultsmap,
        path.move(0, 0)
        .line( triangle_width/2, triangle_height, true )
        .line( triangle_width/2, -triangle_height, true )
        .close(),
        {
            fill: 'white',
            stroke: '#CDCDCD',
            strokeWidth: 2,
            id: 'results_triangle'
        }
    );
    
	$(triangle).data('settings', {'mode': 'default'});

    /*
    var threshold_x = triangle_width*questionViewModel.mapx;
    var threshold_y = triangle_height*questionViewModel.mapy;
    var threshold = {'mapx': threshold_x, 'mapy': threshold_y};
    */
    var g = svg.group(resultsmap, 'votes'); // mapgroup

    $.each(questionViewModel.voting_data, function(pid, coords) {
        if (!coords['median'])
        {
            return;
        }
        
        if (questionViewModel.results_pf_only() && coords['dominated_by'] != 0)
        {
            return;
        }
        
        console.log("pid is type " + typeof pid);

        var cx = triangle_width * coords['median'].medx;
        var cy = triangle_height * coords['median'].medy;
        cy += triangle_offset_y;
        //var pareto = coords['pareto'];
        var pareto = coords['pareto'];

        //console.log("Draw result vote at (" + cx + ", " + cy +")");
        /*
        var med_fill, med_selected_fill_color;
        if  (pareto)
        {
            med_fill = MEDIAN_WINNER_COLOR;
            med_selected_fill_color = MEDIAN_WINNER_SELECTED_COLOR;
        }
        else
        {
            med_fill = MEDIAN_COLOR;
            med_selected_fill_color = MEDIAN_SELECTED_COLOR;
        }
    
        med_fill = MEDIAN_COLOR;
        med_selected_fill_color = MEDIAN_SELECTED_COLOR;
        */

        // var title ='Proposal ' + pid;
        var title;
        var prop = proposalsViewModel.getProposal(pid);

        //title = 'Coords (' + cx + ', ' + cy + ')';

        if (prop)
        {
             title = prop.title();
        }
        else
        {
            title = 'Proposal ID ' + pid
        }

        med = svg.circle(g, cx, cy, RADIUS+1, {class: 'med', title: title}); 
        $(med).data('settings', {'pid': parseInt(pid), 'pareto': coords['pareto']});

        // expo
        if (pareto)
        {
            if (questionViewModel.phase() != 'results')
            {
                $(med).addClass('pareto');
            }
            else
            {
                fill_color = setMapColor(coords['median'].medx, coords['median'].medy);
            }
        }

        // Display proposal ID
        var txtx, txty;
        txtx = cx;
        if (cy < 30)
        {
            txty = cy + 25;
        }
        else
        {
            txty = cy - 20;
        }
        var medlabel = svg.text(g, txtx, txty, String(pid));
        $(medlabel).data('settings', {'pid': parseInt(pid)}).addClass('medlabel');
        if (coords['pareto'])
        {
            $(medlabel).addClass('pareto');
        }

        $(med).on( "click", function(e) {
            console.log('click on median...');
            e.stopPropagation();
            showProposalVotes(this, svg); // humbug
        });
    });
}

function getSVGDimensions(selector)
{
    if ( $(selector).hasClass('hasSVG') === false)
    {
        return false;
    }
    else
    {
        var svg = $(selector).svg('get');
        var width = $(svg._container).innerWidth();
        var height = $(svg._container).innerHeight();
        return {'width': width, 'height': height};
    }
}
function getVotingMapDimensions()
{
    var dimensions = getSVGDimensions('#modalvotesmap');
    dimensions['height'] = 0.7 * dimensions['width'];
    return dimensions;
}
function getResultsMapDimensions()
{
    var dimensions = getSVGDimensions('#resultstriangle');
    dimensions['height'] = 0.7 * dimensions['width'];
    return dimensions;
}

function createGradient(svg, id, stops){
  var svg = svg._svg;
  var svgNS = svg.namespaceURI;
  var grad  = document.createElementNS(svgNS,'linearGradient');
  grad.setAttribute('id',id);
  for (var i=0;i<stops.length;i++){
    var attrs = stops[i];
    var stop = document.createElementNS(svgNS,'stop');
    for (var attr in attrs){
      if (attrs.hasOwnProperty(attr)) stop.setAttribute(attr,attrs[attr]);
    }
    grad.appendChild(stop);
  }

  var defs = svg.querySelector('defs') ||
      svg.insertBefore( document.createElementNS(svgNS,'defs'), svg.firstChild);
  return defs.appendChild(grad);
}

function createVoteMapLinear(svg)
{
	//alert('createVoteMapLinear called');

	console.log('createVoteMapLinear called........');

	var container_width = $(svg._container).innerWidth();
	//console.log('container_width = ' + container_width);
    var container_height = 0.7 * container_width;
    //console.log('container_height = ' + container_height);
    
    var canvas = {};
    canvas.width = $(svg._container).innerWidth();
    canvas.height = 0.7 * container_width;
    resetSize(svg, canvas.width, canvas.height);
    
    //var dimensions = getResultsMapDimensions();
    var dimensions = calculateLinearModalTriangleDimensions(svg);
    var max_x = dimensions.width;
    var max_y = dimensions.height; // bah
    console.log("dimensions = " + max_x + ', ' + max_y);
    
    //var max_x = container_width;
    //var max_y = container_height;
    var triangle_width = max_x;
    var triangle_height = max_y;
    
    var tg = svg.group('votemap');
	var path = svg.createPath();
	
	var defs = svg.defs();
    svg.linearGradient(defs, 'lineargradient', [[0, '#FF0000', 1], [1, '#00FF00', 1]], 0, 0, max_x, 0, {gradientUnits: 'objectBoundingBox'}); 
    
    
    createGradient(svg,'lineargradient2',[
      {offset:'5%', 'stop-color':'#FF0000'},
      {offset:'95%','stop-color':'#00FF00'}
    ]);

    triangle = svg.path(
        tg,
        path.move(0, LINEAR_MAP_OFFSET_Y)
        .line( triangle_width, 0, true )
        .line( 0, triangle_height, true )
        .line( -triangle_width, 0, true )
        .close(),
        {
            fill: 'url(#lineargradient2)',
            stroke: '#CDCDCD',
            strokeWidth: 2,
            id: 'vote_map',
            class: 'linear'
        }
    );
        
    $(triangle).data('offsets', {'x': 0, 'y': LINEAR_MAP_OFFSET_Y});

    var agree_oppose_y = LINEAR_MAP_OFFSET_Y + 100;
    var agree_oppose_text_y = agree_oppose_y - 10;
    
    svg.text(15, agree_oppose_text_y, 'Oppose', {class: 'map_guide', id: 'uboxtext', fill: 'red', strokeWidth: 2, fontSize: '20', fontFamily: 'Verdana',});
    svg.text(triangle_width-100, agree_oppose_text_y, 'Agree', {class: 'map_guide', id: 'aboxtext', fill: 'green', strokeWidth: 2, fontSize: '20', fontFamily: 'Verdana',});
    

    var g = svg.group(tg, 'votes');
    /*
    var threshold_x = container_width*questionViewModel.mapx;
    var threshold_y = container_height*questionViewModel.mapy;
    var active_proposal_index;*/
    
    // Add the other proposals first
    $.each(proposalsViewModel.proposals(), function(i, proposal)
    {
        if (isNaN(proposal.mapx()) || isNaN(proposal.mapy()))
        {
            console.log('no map coords');
            return true;
        }
        
        if (proposal.id() == voteMapViewModel.proposal_id())
        {
            active_proposal_index = i;
            console.log("Ignoring active proposal " + proposal.id() + " at index " + i);
            return true;
        }

        var votex = triangle_width * proposal.mapx(); // strike
        fill_color = MEDIAN_COLOR;
        cursor_type = 'arrow';
        
        var y1 = LINEAR_MAP_OFFSET_Y;
        var y2 = LINEAR_MAP_OFFSET_Y+LINEAR_MAP_HEIGHT;

        // {stroke: fill_color, strokeWidth: 2, cursor: cursor_type, title: proposal.title()}
        vote = svg.line(g, votex, y1, votex, y2, {stroke: fill_color, strokeWidth: 2, cursor: cursor_type, title: proposal.title()});
        
        $(vote).data('pid', proposal.id()); // remove
        $(vote).data('settings', {'pid': proposal.id()});

        // Display proposal ID
        var txtx = votex;
        var txty = LINEAR_MAP_OFFSET_Y - 20;
        label = svg.text(g, txtx, txty, String(proposal.id()));
        $(label).data('settings', {'pid': proposal.id()});
    });
    // Add active vote last
    var proposal = voteMapViewModel.proposal;
    
    if (isNaN(proposal.mapx()) == false && isNaN(proposal.mapy()) == false)
    {
        votex = triangle_width * proposal.mapx();
        fill_color = 'white';//setMapColorLinear(proposal.mapx());
        cursor_type = 'pointer';
        
        // {class: 'vote active', stroke: fill_color, strokeWidth: LINEAR_MAP_VOTE_WIDTH, cursor: cursor_type, title: proposal.title()}
        vote = svg.line(g, votex, LINEAR_MAP_OFFSET_Y, votex, LINEAR_MAP_OFFSET_Y + LINEAR_MAP_HEIGHT, {class: 'vote active draggable', stroke: fill_color, strokeWidth: LINEAR_MAP_VOTE_WIDTH, cursor: cursor_type, title: proposal.title()});
        
        $(vote).data('pid', proposal.id()); // remove
        $(vote).data('settings', {'pid': proposal.id()});
        $(vote).on("mousedown", beginDraggingVoteLinear);
        $(vote).on("mouseup", voteAfterDragLinear);
        
        // Add label
        var txtx = votex;
        var txty = LINEAR_MAP_OFFSET_Y - 20;
        var activelabel = svg.text(g, txtx, txty, String(proposal.id()), {'stroke': '#0000cc'});
        $(activelabel).data('settings', {'pid': proposal.id()}).addClass("activelabel"); 
        /*
        var medlabel = svg.text(g, txtx, txty, String(pid));
        $(medlabel).data('settings', {'pid': parseInt(pid)}).addClass('medlabel');
        */
    }
    else
    {
        console.log('no active vote coords');
    }
    
    
    $(triangle).on( "mousemove", helpersMouseTrackerLinear);
    
    // Record vote on votemap
    $(triangle).on( "click", triangleClickHandlerLinear );
    
    function triangleClickHandlerLinear(e) // bosh
    {
        console.log("triangleClickHandlerLinear called...");
    
        //var triangle = $('#vote_map');
        var triangle = $(this);
        //triangle.off( "click", triangleClickHandlerLinear);
    
        var vote = $('.vote.draggable');
        if (vote && $(vote).hasClass('dragged'))
        {
            console.log("Dragged vote found. Ignore click *******");
            $(vote).removeClass('dragged');
            return;
        }
    
        console.log('Linear voting map clicked!!!!! Recording vote...');
    	var posX = $(this).offset().left;

    	var cx;
    	if (typeof $.browser.webkit == 'undefined')
    	{
    	    cx = e.pageX - posX - LINEAR_MAP_VOTE_WIDTH;
    	}
    	else
    	{
    	    cx = e.pageX - posX;
    	}
    	var svg = $('#modalvotesmap').svg('get');
    	var dimensions = calculateLinearModalTriangleDimensions(svg);
        var max_x = dimensions.width;

    	// Endorse with normalised vote coordinates
    	var n_cx = cx / max_x;
    	var n_cy = 0.0;

    	var ajax_call = proposalsViewModel.mapEndorseWithIndex(n_cx, n_cy, voteMapViewModel.proposal);
    	$(triangle).data('add_vote_jqXHR', ajax_call);
    }
    function helpersMouseTrackerLinear(e)
    {
        var posX = $(this).offset().left;
    	var posY = $(this).offset().top;

    	var cx, cy;
    	if (typeof $.browser.webkit == 'undefined')
    	{
    	    cx = e.pageX - posX - LINEAR_MAP_VOTE_WIDTH;
    	    cy = e.pageY - posY - LINEAR_MAP_VOTE_WIDTH;
    	}
    	else
    	{
    	    cx = e.pageX - posX;
    	    cy = e.pageY - posY;
    	}

    	var max_x = $(svg._container).innerWidth();
    	var max_y = $(svg._container).innerHeight();

        var norm_cx = cx / max_x;
    	var norm_cy = cy / max_y;

    	var horizontal_width = 250;
    	var vertical_height = 200;

    	var agree_val = norm_cx * horizontal_width;
    	var oppose_val = (1 - norm_cx) * horizontal_width;
    	var understand_val = (1 - norm_cy) * horizontal_width;
    	var vunderstand_val = norm_cy * vertical_height;

    	$('#haobox').attr('width', oppose_val);
    	$('#vubox').attr('height', vunderstand_val);
    }
    
    $(triangle).on("mouseup", function(e)
    {
        console.log("triangle mouseup...");
        var dragged_vote = $('.vote.dragged');
        console.log(dragged_vote.length + " dragged_votes found...");
        console.log("Trigger mousup on dragged vote");
        var event = jQuery.Event( "mouseup" );
        event.pageX = e.pageX;
        event.pageY = e.pageY;
        dragged_vote.trigger(e);
    });
}


// votemap
function createVoteMap(svg)
{
	//alert('createVoteMap called');

	console.log('createVoteMap called...');
	
	var container_width = $(svg._container).innerWidth();
	//console.log('container_width = ' + container_width);
    var container_height = 0.7 * container_width;
    //console.log('container_height = ' + container_height);
    
    var canvas = {};
    canvas.width = $(svg._container).innerWidth();
    canvas.height = 0.7 * container_width;
    resetSize(svg, canvas.width, canvas.height);
    
    //var dimensions = getResultsMapDimensions();
    var dimensions = calculateModalTriangleDimensions(svg);
    var max_x = dimensions.width;
    var max_y = dimensions.height;
    
    //var max_x = container_width;
    //var max_y = container_height;
    var triangle_width = max_x;
    var triangle_height = max_y;
    
    var tg = svg.group('votemap');
	var path = svg.createPath();
	
    var triangle = svg.path(
        tg,
        path.move(0, 0)
        .line( triangle_width/2, triangle_height, true )
        .line( triangle_width/2, -triangle_height, true )
        .close(),
        {
            fill: 'white',
            stroke: '#CDCDCD',
            strokeWidth: 2,
            id: 'vote_map'
        }
    );
    $(triangle).data('offsets', {'x': 0, 'y': 0});
    //$(triangle).data('settings', {'add_vote_jqXHR': null});
    $(triangle).data('add_vote_jqXHR',  null);
    
    var agree_oppose_y;
    if (questionViewModel.voting_type() == 1)
    {
        agree_oppose_y = 75;
    }
    else
    {
        agree_oppose_y = 130;
    }
    var agree_oppose_text_y = agree_oppose_y + 10;
    
    var agree_oppose = svg.rect(20, container_height-agree_oppose_y, 250, 30, 5, 5, {class: 'map_guide', fill: 'green', stroke: 'grey', strokeWidth: 3});
    var agree_oppose_fill = svg.rect(20, container_height-agree_oppose_y, 125, 30, {class: 'map_guide', id: 'haobox', fill: 'red', stroke: 'none'});
    svg.text(15, container_height-agree_oppose_text_y, 'Oppose', {class: 'map_guide', id: 'uboxtext', fill: 'red', strokeWidth: 2, fontSize: '20', fontFamily: 'Verdana',});
    svg.text(210, container_height-agree_oppose_text_y, 'Agree', {class: 'map_guide', id: 'aboxtext', fill: 'green', strokeWidth: 2, fontSize: '20', fontFamily: 'Verdana',});

  var vunderstand = svg.rect(container_width-110, container_height-230, 30, 200, 5, 5, {class: 'map_guide', fill: 'yellow', stroke: 'grey', stroke: 'none'});
        var vunderstand_fill = svg.rect(container_width-110, container_height-230, 30, 100, {class: 'map_guide', id: 'vubox', fill: '#cdcdcd', stroke: 'none'});
        svg.text(container_width-165, container_height-240, 'Understand', {class: 'map_guide', id: 'aboxtext', fill: '#885ead', strokeWidth: 2, fontSize: '20', fontFamily: 'Verdana'});


    var g = svg.group(tg, 'votes');
    /*
    var threshold_x = container_width*questionViewModel.mapx;
    var threshold_y = container_height*questionViewModel.mapy;
    var active_proposal_index;
    */
    /*
    var offset_x = 0, offset_y = 0;
    var offsets = $('#modalvotesmap #vote_map').data('offsets');
    if (typeof offsets != 'undefined')
    {
        offset_x = offsets.x;
        offset_y = offsets.y;
    }*/

    // Add the other proposals first
    $.each(proposalsViewModel.proposals(), function(i, proposal)
    {
        if (isNaN(proposal.mapx()) || isNaN(proposal.mapy()))
        {
            console.log('no map coords');   // createvotemap
            return true;
        }
        
        if (proposal.id() == voteMapViewModel.proposal_id())
        {
            active_proposal_index = i;
            console.log("Ignoring active proposal " + proposal.id() + " at index " + i);
            return true;
        }

        var cx = triangle_width * proposal.mapx();
        var cy = triangle_height * proposal.mapy();
        //console.log("Draw vote at (" + cx + ", " + cy +")");
        
        cx += triangle_offset_x;
        cy += triangle_offset_y;

        fill_color = MEDIAN_COLOR;
        cursor_type = 'arrow';

        vote = svg.circle(g, cx, cy, RADIUS+1, {class: 'vote', fill: fill_color, cursor: cursor_type, title: proposal.title()});
        $(vote).data('pid', parseInt(proposal.id()));
        $(vote).data('settings', {'pid': parseInt(proposal.id())});

        // Display proposal ID
        var txtx, txty;
        txtx = cx;
        if (cy < 30)
        {
            txty = cy + 25;
        }
        else
        {
            txty = cy - 20;
        }
        svg.text(g, txtx, txty, String(proposal.id()));
        /*
        $(vote).on( "click", function(e) {
            console.log('click on vote');
            $(this).parent().siblings('#map').trigger(e);
        });
        $(vote).on( "mousemove", function(e) {
            $(this).parent().siblings('#map').trigger(e);
        });
        */
    });
    // Add active vote last
    //var proposal = proposalsViewModel.proposals()[voteMapViewModel.proposal_index()]; // don't use index!!!
    var proposal = voteMapViewModel.proposal; // booms
    
    if (isNaN(proposal.mapx()) == false && isNaN(proposal.mapy()) == false)
    {
        cx = triangle_width * proposal.mapx() + triangle_offset_x;
        cy = triangle_height * proposal.mapy() + triangle_offset_y;
        fill_color = setMapColor(proposal.mapx(), proposal.mapy());
        cursor_type = 'pointer';
        vote = svg.circle(g, cx, cy, RADIUS+1, {class: 'vote', fill: fill_color, cursor: cursor_type});
        $(vote).data('pid', parseInt(proposal.id()));
        $(vote).data('settings', {'pid': parseInt(proposal.id())});
        $(vote).addClass('draggable').addClass('active');
        /*
        $(vote).on( "click", function(e) {
            console.log('click on vote');
            $(this).parent().siblings('#map').trigger(e);
        });
        $(vote).on( "mousemove", function(e) {
            $(this).parent().siblings('#map').trigger(e);
        });
        */
        // humbug
        $(vote).on("mousedown", beginDraggingVote);
        $(vote).on("mouseup", voteAfterDrag);
    }
    else
    {
        console.log('no active vote coords');
    }
    
    function triangleClickHandler(e) // bosh
    {
        console.log("triangleClickHandler called...");
        e.stopPropagation();
        
        var triangle = $('#vote_map');
        
        if (triangle.data('add_vote_jqXHR') != null)
        {
            //console.log("*********************************************************************");
		    console.log("******* triangleClickHandler: Still adding vote: IGNORE CLICK *******");
		    //console.log("*********************************************************************");
            return;
        }
        
        var vote = $('.vote.active');
        
        if (vote.length && wasDragged(vote, e))
        {
            console.log("******** Dragged vote found. Ignore click *******"); // fixer
            return;
        }
        
        console.log('Voting triangle clicked!!!!! Recording vote...');
    	var posX = $(this).offset().left;
    	var posY = $(this).offset().top;

    	var cx, cy;
    	if (typeof $.browser.webkit == 'undefined')
    	{
    	    cx = e.pageX - posX - RADIUS;
    	    cy = e.pageY - posY - RADIUS;
    	}
    	else
    	{
    	    cx = e.pageX - posX;
    	    cy = e.pageY - posY;
    	}
    	
    	//cx += triangle_offset_x;
        //cy += triangle_offset_y;

    	// Endorse with normalised vote coordinates
    	var n_cx = cx / max_x;
    	var n_cy = cy / max_y;

    	var ajax_call = proposalsViewModel.mapEndorseWithIndex(n_cx, n_cy, voteMapViewModel.proposal);
    	$(triangle).data('add_vote_jqXHR', ajax_call);
    	
    	$.when( triangle.data('add_vote_jqXHR') ).done(function()
		{
		    //console.log("***************************************");
		    //console.log("***************************************");
		    console.log("******* add_vote_jqXHR complete *******");
		    //console.log("***************************************");
		    //console.log("***************************************");
		    
		    $(triangle).data('add_vote_jqXHR', null);
		    $(triangle).on( "click", triangleClickHandler );
	    });
    }

    function helpersMouseTracker(e)
    {
        var posX = $(this).offset().left;
    	var posY = $(this).offset().top;

    	var cx, cy;
    	if (typeof $.browser.webkit == 'undefined')
    	{
    	    cx = e.pageX - posX - RADIUS;
    	    cy = e.pageY - posY - RADIUS;
    	}
    	else
    	{
    	    cx = e.pageX - posX;
    	    cy = e.pageY - posY;
    	}
    	
    	//cx += triangle_offset_x;
        //cy += triangle_offset_y;

    	var max_x = $(svg._container).innerWidth();
    	var max_y = $(svg._container).innerHeight();

        var norm_cx = cx / max_x;
    	var norm_cy = cy / max_y;

    	var horizontal_width = 250;
    	var vertical_height = 200;

    	var agree_val = norm_cx * horizontal_width;
    	var oppose_val = (1 - norm_cx) * horizontal_width;
    	var understand_val = (1 - norm_cy) * horizontal_width;
    	var vunderstand_val = norm_cy * vertical_height;

    	$('#haobox').attr('width', oppose_val);
    	$('#vubox').attr('height', vunderstand_val);
    }
    
    /*
    $(triangle).on( "mouseup", function(e) {
        $(this).off( "mousemove");
        alert('mousemove listener off');
    });*/
    
    $(triangle).on( "mousemove", helpersMouseTracker);
    
    // Record vote on votemap
    $(triangle).on( "click", triangleClickHandler );
}

// herebe
function beginDraggingVoteResultsLinear(e)
{
    e.preventDefault();
    //e.stopPropagation();
    console.log("beginDraggingVoteResultsLinear: Mousedown on draggable results vote!!!!!");
    if ($(this).hasClass('draggable'))
    {
        startDrag(this, e);
        console.log("Add trackDraggableVote handler to triangle...");
        var triangle = $('#results_triangle');
        triangle.on( "mousemove", trackDraggableVoteResultsLinear);
    }
}
// results triangle
function beginDraggingVoteResults(e)
{
    e.preventDefault();
    //e.stopPropagation();
    console.log("Mousedown on draggable results vote!!!!!");
    if ($(this).hasClass('draggable'))
    {
        //$(this).addClass('dragged');
        startDrag(this, e);
        console.log("Add trackDraggableVote handler to triangle...");
        var triangle = $('#results_triangle');
        triangle.on( "mousemove", trackDraggableVoteResults);
    }
}


function startDrag(obj, e)
{
    console.log("startDrag called...");
    $(obj).data('dragstart', {'posx': e.pageX, 'posy': e.pageY}).addClass('dragged');
    console.log("startDrag: X, Y: " + $(obj).data('dragstart').posx + ", " + $(obj).data('dragstart').posy);
}
function wasDragged(obj, e)
{
    console.log("wasDragged called...");
    if (typeof $(obj).data('dragstart') == 'undefined')
    {
        console.log("wasDragged: data('dragstart') undefined!!!!!");
        return false;
    }
    else
    {
        console.log("wasDragged: X, Y: " + $(obj).data('dragstart').posx + ", " + $(obj).data('dragstart').posy);
        console.log("wasDragged: eX, eY: " + e.pageX + ", " + e.pageY);
        console.log("Diff X: " + Math.abs($(obj).data('dragstart').posx - e.pageX));
        console.log("Diff Y: " + Math.abs($(obj).data('dragstart').posy - e.pageY));
        return Math.abs($(obj).data('dragstart').posx - e.pageX) > 2 || Math.abs($(obj).data('dragstart').posy - e.pageY) > 2;
    }
}
function endDrag(obj, e)
{
    console.log("endDrag called...");
    var was_dragged = wasDragged(obj, e);
    $(obj).removeData('dragstart').removeClass('dragged');
    return was_dragged;
}


// bosh
function voteAfterDragResults(e) // stark
{
    //e.preventDefault();
    //e.stopPropagation();
    console.log("Mouseup on draggable vote!!!!!");
    var triangle = $('#results_triangle');
    triangle.off( "mousemove", trackDraggableVoteResults);
    
    var vote = $('.vote.dragged');
    
    var moved = endDrag(vote, e);
    if (!moved)
    {
        console.log("voteAfterDragResults: Mouse didn't move!");
        return;
    }
    
    console.log("voteAfterDragResults: " + vote.length + " dragged votes found");
    if (vote.length == 0)
    {
        console.log("voteAfterDragResults: No dragged votes found!");
        return;
    }
    var cx = $(vote).attr('cx');
    var cy = $(vote).attr('cy');
    
    //var dimensions = getResultsMapDimensions();
    var svg = $('#resultstriangle').svg('get');
    var dimensions = calculateModalTriangleDimensions(svg);
    var max_x = dimensions.width;
    var max_y = dimensions.height;
    
    // Endorse with normalised vote coordinates
	var n_cx = cx / max_x;
	var n_cy = cy / max_y;
	
	vote.removeClass('dragged'); // haha
	var pid = vote.data('settings').pid;
	
	proposalsViewModel.resultsmapEndorseProposal(n_cx, n_cy, pid);
}

function voteAfterDragResultsLinear(e) // lanister
{
    //e.preventDefault();
    //e.stopPropagation();
    console.log("voteAfterDragResultsLinear: Mouseup on draggable vote!!!!!");
    var triangle = $('#results_triangle');
    triangle.off( "mousemove", trackDraggableVoteResultsLinear);
    
    var vote = $('.vote.dragged');
    
    console.log("voteAfterDragResultsLinear: " + vote.length + " dragged votes found");
    if (vote.length == 0)
    {
        console.log("voteAfterDragResultsLinear: No dragged votes found!");
        return;
    }
    
    var moved = endDrag(vote, e);
    if (!moved)
    {
        console.log("voteAfterDragResultsLinear: Mouse didn't move - ignore... MMMMMMM"); // fixer
        return;
    }
    
    var cx = $(vote).attr('x1');
    var svg = $('#resultstriangle').svg('get');
    var dimensions = calculateTriangleDimensions(svg);
    var max_x = dimensions.width;
    
    // Endorse with normalised vote coordinates
	var n_cx = cx / max_x;
	var n_cy = 0.0;
	
	var pid = vote.data('settings').pid;
	
	proposalsViewModel.resultsmapEndorseProposal(n_cx, n_cy, pid);
}


function trackDraggableVoteResultsLinear(e)
{
    console.log("trackDraggableVoteResultsLinear: mousemove on results triangle!!!!!");
    var posX = $(this).offset().left;
	var cx;
	
	if (typeof $.browser.webkit == 'undefined')
	{
	    cx = e.pageX - posX - LINEAR_MAP_VOTE_WIDTH;
	}
	else
	{
	    cx = e.pageX - posX;
	}
	
	//var dimensions = getResultsMapDimensions();
	var svg = $('#resultstriangle').svg('get');
    var dimensions = calculateTriangleDimensions(svg);
	var container_width = dimensions.width;
	
	var n_cx = cx / container_width;
	
	//var fill_color = setMapColorLinear(n_cx);
	var vote = $('.vote.dragged', svg.root());
	if (vote.length == 0)
	{
	    console.log("trackDraggableVoteResultsLinear: NO VOTE FOUND !!!!");
	}
	else if (vote.length > 1)
	{
	    console.log("MORE THAN ONE VOTE FOUND !!!!");
	}
	else
	{
        vote.attr('x1', cx).attr('x2', cx);
        var vote_label = $('.vote_label', svg.root()).filter(function() {
    		return $(this).data("settings").pid == vote.data('settings').pid && $(this).data("settings").userid == vote.data('settings').userid;
    	});
        $(vote_label).attr('x', cx);
    }
}

function trackDraggableVoteResults(e)
{
    console.log("trackDraggableVoteResults: mousemove on results triangle!!!!!");
    var posX = $(this).offset().left;
	var posY = $(this).offset().top;

	var cx, cy;
	if (typeof $.browser.webkit == 'undefined')
	{
	    cx = e.pageX - posX - RADIUS;
	    cy = e.pageY - posY - RADIUS;
	}
	else
	{
	    cx = e.pageX - posX;
	    cy = e.pageY - posY;
	}
	
	cx += triangle_offset_x;
    cy += triangle_offset_y;
	
	console.log("cx:" + cx + ", cy:" + cy);
	
	//var dimensions = getResultsMapDimensions();
	var svg = $('#resultstriangle').svg('get');
    var dimensions = calculateModalTriangleDimensions(svg);
	var container_width = dimensions.width;
	var container_height = dimensions.height;
	
	var n_cx = cx / container_width;
	var n_cy = cy / container_height;
	
	var fill_color = setMapColor(n_cx, n_cy);
	var vote = $('.vote.dragged', svg.root());
	if (vote.length == 0)
	{
	    console.log("trackDraggableVoteResults: NO VOTE FOUND !!!!");
	}
	else if (vote.length > 1)
	{
	    console.log("MORE THAN ONE VOTE FOUND !!!!");
	}
	else
	{
        $('.vote.dragged').attr('cx', cx).attr('cy', cy).attr('fill', fill_color);
        // addline
        
        // Update line connecting vote with median
        /*
        var med =  $('.med', svg.root()).filter(function() {
    		return $(this).data("pid") == $(vote).data("pid");
    	});
    	if (med.length == 0)
    	{
    	    console.log("trackDraggableVoteResults: Med not found");
    	    return;
    	}
    	*/
        var medline = $('.medline', svg.root()).filter(function() {
    		return $(this).data("settings").pid == $(vote).data("settings").pid && $(this).data("settings").userid == $(vote).data("settings").userid;
    	});
    	if (medline.length == 0)
    	{
    	    console.log("medline not found");
    	}
    	else
    	{
            $(medline).attr('x1', cx)
                      .attr('y1', cy)
                      .attr('stroke', fill_color);
        }
    }
}
// Voting triangle harpo
function beginDraggingVoteLinear(e)
{
    e.preventDefault();
    //e.stopPropagation();
    console.log("beginDraggingVoteLinear: Mousedown on draggable linear vote!!!!!");
    if ($(this).hasClass('draggable'))
    {
        //$(this).addClass('dragged');
        startDrag(this, e);
        console.log("Add trackDraggableVoteLinear handler to triangle...");
        var triangle = $('#vote_map');
        triangle.on( "mousemove", trackDraggableVoteLinear);
    }
}
function beginDraggingVote(e)
{
    e.preventDefault();
    //e.stopPropagation();
    console.log("Mousedown on draggable vote!!!!!");
    if ($(this).hasClass('draggable'))
    {
        //$(this).addClass('dragged');
        startDrag(this, e);
        console.log("Add trackDraggableVote handler to triangle...");
        var triangle = $('#vote_map');
        triangle.on( "mousemove", trackDraggableVote);
    }
}

function voteAfterDragLinear(e)
{
    console.log("voteAfterDragLinear called...");
    e.preventDefault();
    //e.stopPropagation();
    console.log("Mouseup on draggable vote!!!!!");
    var triangle = $('#vote_map');
    $(triangle).off( "mousemove", trackDraggableVoteLinear);
    var vote = $('.vote.dragged');
    console.log("voteAfterDragLinear: " + vote.length + " dragged votes found");
    
    //if ($.clickMouseMoved() == false)
    if (!endDrag(vote, e))
    {
        console.log("voteAfterDragLinear: Mouse didn't move - ignore... MMMMMMM"); // fixer
        return;
    }
    
    var cx = $(vote).attr('x1');
    //cx -= triangle_offset_x;
    var svg = $('#modalvotesmap').svg('get');
    var dimensions = calculateLinearModalTriangleDimensions(svg);
    var max_x = dimensions.width;
    
    // Endorse with normalised vote coordinates
	var n_cx = cx / max_x;
	var n_cy = 0.0;
	proposalsViewModel.mapEndorseWithIndex(n_cx, n_cy, voteMapViewModel.proposal);
}
function voteAfterDrag(e)
{
    e.preventDefault();
    //e.stopPropagation();
    console.log("voteAfterDrag: Mouseup on draggable vote!!!!!");
    var triangle = $('#vote_map');
    $(triangle).off( "mousemove", trackDraggableVote);
    
    //if ($.clickMouseMoved() == false)
    var vote = $('.vote.dragged');
    
    var moved = endDrag(vote, e);
    if (!moved)
    {
        console.log("voteAfterDrag: Mouse didn't move - ignore");
        return;
    }
    
    var cx = $(vote).attr('cx');
    var cy = $(vote).attr('cy');
    
    var dimensions = getVotingMapDimensions();
    var max_x = dimensions.width;
    var max_y = dimensions.height;
    
    // Endorse with normalised vote coordinates
	var n_cx = cx / max_x;
	var n_cy = cy / max_y;
	
	proposalsViewModel.mapEndorseWithIndex(n_cx, n_cy, voteMapViewModel.proposal);
}


function trackDraggableVoteLinear(e)
{
    console.log("trackDraggableVoteLinear: mousemove on triangle!!!!!");
    var posX = $(this).offset().left;
	var cx;
	
	if (typeof $.browser.webkit == 'undefined')
	{
	    cx = e.pageX - posX - LINEAR_MAP_VOTE_WIDTH;
	}
	else
	{
	    cx = e.pageX - posX;
	}
	
	var svg = $('#modalvotesmap').svg('get');
	var dimensions = calculateTriangleDimensions(svg);
    var max_x = dimensions.width;
	
	var n_cx = cx / max_x;
	
	var vote = $('.vote.draggable');
	if (vote.length == 0)
	{
	    console.log("NO VOTE FOUND !!!!");
	}
	else
	{
        $('.vote.draggable').attr('x1', cx).attr('x2', cx);
        $('.activelabel').attr('x', cx);
    }
}
function trackDraggableVote(e)
{
    console.log("trackDraggableVote: mousemove on triangle!!!!!");
    var posX = $(this).offset().left;
	var posY = $(this).offset().top;

	var cx, cy;
	/*
	var offset_x = 0, offset_y = 0;
    var offsets = $('#modalvotesmap #vote_map').data('offsets');
    if (typeof offsets != 'undefined')
    {
        offset_x = offsets.x;
        offset_y = offsets.y;
    }*/
	
	if (typeof $.browser.webkit == 'undefined')
	{
	    cx = e.pageX - posX - RADIUS;
	    cy = e.pageY - posY - RADIUS;
	}
	else
	{
	    cx = e.pageX - posX;
	    cy = e.pageY - posY;
	}
	
	cx += triangle_offset_x;
	cy += triangle_offset_y;
	
	var svg = $('#modalvotesmap').svg('get');
	var dimensions = calculateModalTriangleDimensions(svg);
    var max_x = dimensions.width;
    var max_y = dimensions.height;
	
	var n_cx = cx / max_x;
	var n_cy = cy / max_y;
	
	var fill_color = setMapColor(n_cx, n_cy);
	var vote = $('.vote.draggable');
	if (vote.length == 0)
	{
	    console.log("NO VOTE FOUND !!!!");
	}
	else
	{
        $('.vote.draggable').attr('cx', cx).attr('cy', cy).attr('fill', fill_color);
    }
}

function trackDraggableVote_v1(e)
{
    console.log("trackDraggableVote: mousemove on triangle!!!!!");
    var posX = $(this).offset().left;
	var posY = $(this).offset().top;

	var cx, cy;
	if (typeof $.browser.webkit == 'undefined')
	{
	    cx = e.pageX - posX - RADIUS;
	    cy = e.pageY - posY - RADIUS;
	}
	else
	{
	    cx = e.pageX - posX;
	    cy = e.pageY - posY;
	}
	
	//cx += triangle_offset_x;
    //cy += triangle_offset_y;
	
	var dimensions = getVotingMapDimensions(); // hoop
	var container_width = dimensions.width;
	var container_height = dimensions.height;
	
	var n_cx = cx / container_width;
	var n_cy = cy / container_height;
	
	var fill_color = setMapColor(n_cx, n_cy);
	var vote = $('.vote.draggable');
	if (vote.length == 0)
	{
	    console.log("NO VOTE FOUND !!!!");
	}
	else
	{
        $('.vote.draggable').attr('cx', cx).attr('cy', cy).attr('fill', fill_color);
    }
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
	var votemap = $('.votemap', jqsvg.root()).get(0); //jazz
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

	/*
	$(votemap).on( "mouseout", function(e) {
    	console.log('mouse out...');
    	return;
    	var jqsvg = $('#cvtriangle').svg('get');
    	var pointer = $('.pointer', jqsvg.root()).remove();
	});*/

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

var QuestPermissions = function(desc, value) {
    this.desc = desc;
    this.perm = perm;
};

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

function add_modal_alert(modal_id, alert, text)
{
    var modal = $(modal_id);
    if (modal.length == 0 || modal.is(':visible') == false) { return; }
    
    modal.find('.alert').fadeOut().remove();

    var alertbox = '<div class="alert alert-'+ alert + '">';
	alertbox = alertbox + '	<span class="flash">' + alert_flash[alert] + '</span> <span class="text">';
	alertbox = alertbox + text + '</span>';
	alertbox = alertbox +  '</div>';

	var alert = modal.find('.modal-body').prepend(alertbox);
	$(alert).fadeIn();
}

function add_form_alert(containerid, alert, text, class_id) // thrones
{
    if (typeof(class_id) == 'undefined')
    {
        class_id = '';
    }
    else
    {
        // Do not add alert box if one with this class already displayed
        if ($('.'+class_id).length)
        {
            return;
        }
    }

    var alertbox = '<div class="main alert alert-'+ alert +' alert-dismissable ' + class_id + '">';
	alertbox = alertbox + '	<span class="flash">' + alert_flash[alert] + '</span> <span class="text">';
	alertbox = alertbox + text + '</span>';
	alertbox = alertbox +  '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button></div>';

	var container = $('#'+containerid);
	container.prepend(alertbox);
	$(alertbox).fadeIn();
}

function add_page_alert(alert, text, class_id) // bear
{
    if (typeof(class_id) == 'undefined')
    {
        class_id = '';
    }
    else
    {
        // Do not add alert box if one with this class already displayed
        if ($('.'+class_id).length)
        {
            return;
        }
    }

    var alertbox = '<div class="main alert alert-'+ alert +' alert-dismissable ' + class_id + '">';
	alertbox = alertbox + '	<span class="flash">' + alert_flash[alert] + '</span> <span class="text">';
	alertbox = alertbox + text + '</span>';
	alertbox = alertbox +  '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button></div>';

	$('.container.main').prepend(alertbox);
	$('.alert.main').fadeIn();
}
function clear_page_alerts()
{
    $('.alert.main').fadeOut().remove();
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
	self.avatar_url = ko.observable('');
	self.login_jqXHR = null;
	self.new_invites = ko.observableArray();
	self.view_invite_id = ko.observable('');
	
    self.fetchNewInvites = function() {
		if (currentUserViewModel.isLoggedOut()) return false;
		console.log("Fetching new invites...");		
		ajaxRequest(VILFREDO_API + '/users/'+ self.userid() +'/new_invites', 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('New Invites data returned...');
			self.new_invites([]);
			var fetched_invites = [];
			for (var i = 0; i < data.invites.length; i++) {
		  		fetched_invites.push({
		  		    id: data.invites[i].id,
					permissions: ko.observable(data.invites[i].permissions),
		      		question_title: ko.observable(data.invites[i].question_title),
					sender_username: ko.observable(data.invites[i].sender_username),
					question_blurb: ko.observable(data.invites[i].question_blurb)
		  		});
			}
			self.new_invites(fetched_invites);
		});
	}
	
	self.setinvitetext = function(invite)
	{
	    var html = "";
	    if (invite.question_title().length > 15)
	    {
	        html = html + invite.question_title().substr(0, 15) + '...';
	    }
	    else
	    {
	        html = html + invite.question_title();
	    }
	    return html;
	}
	
	self.setinvitetooltip = function(invite)
	{
	    var html = "<div>";
	    if (invite.question_title().length > 50)
	    {
	        html = html + invite.question_title().substr(0, 50) + '...</div>';
	    }
	    else
	    {
	        html = html + invite.question_title() + '</div>';
	    }
	    html = html + ' by ' + invite.sender_username();
	    return html;
	}
	self.openInviteQuestionText = function(index, invite)
	{
	    self.view_invite_id(index());
	    console.log("openInviteQuestionText called with invite..." + index());
	    var show_invite = $('#fullquestionblurb');
	    show_invite.find('.alert').remove();
	    show_invite.find('.question_title').html(invite.question_title());
	    show_invite.find('.question_text').html(convertNewlines(invite.question_blurb()));
	    show_invite.modal('show');
	}
	self.closeInviteQuestionText = function()
	{
	    self.view_invite_id(null);
	    var show_invite = $('#fullquestionblurb');
	    show_invite.find('.question_title').html('');
	    show_invite.find('.question_text').html('');
	    show_invite.modal('hide');
	}
	
	self.acceptInviteFromModal = function()
	{
	    console.log("acceptInviteFromModal: accept new invite..." + self.view_invite_id());
	    var invite = self.new_invites()[self.view_invite_id()];
	    console.log("acceptInviteFromModal: accept new invite..." + invite.id);
	    ajaxRequest(VILFREDO_API + '/users/'+ self.userid() +'/new_invites/'+invite.id+'/accept', 'POST').done(function(data, textStatus, jqXHR) {
		    console.log('Invite accepted...');
		    self.closeInviteQuestionText();
		    self.new_invites.remove(invite);
			questionsViewModel.fetchQuestions();
		}).fail(function(jqXHR, textStatus, errorThrown)
		{
		    var message = getJQXHRMessage(jqXHR, 'There was a problem.');
            add_modal_alert('#fullquestionblurb', 'danger', message);
        });
	}
	self.declineInviteFromModal = function()
	{
	    var decline_invite = confirm('Are you sure you want to decline this invitation?');
		if (!decline_invite) return;
	    console.log("acceptInviteFromModal: declined new invite..." + self.view_invite_id());
	    var invite = self.new_invites()[self.view_invite_id()];
	    console.log("acceptInviteFromModal: accept new invite..." + invite.id);	
	    ajaxRequest(VILFREDO_API + '/users/'+ self.userid() +'/new_invites/'+invite.id+'/decline', 'POST').done(function(data, textStatus, jqXHR) {
		    console.log('Invite declined...');
		    self.closeInviteQuestionText();
		    self.new_invites.remove(invite);
		}).fail(function(jqXHR, textStatus, errorThrown)
		{
		    var message = getJQXHRMessage(jqXHR, 'There was a problem.');
            add_modal_alert('#fullquestionblurb', 'danger', message);
        });
	}
	
	self.acceptInvite = function(invite)
	{
	    //alert("acceptInvite called...");
	    console.log("accept new invite..." + invite.id);
	    ajaxRequest(VILFREDO_API + '/users/'+ self.userid() +'/new_invites/'+invite.id+'/accept', 'POST').done(function(data, textStatus, jqXHR) {
		    console.log('Invite accepted...');
		    self.new_invites.remove(invite);
			questionsViewModel.fetchQuestions();
		}).fail(function(jqXHR, textStatus, errorThrown)
		{
		    var message = getJQXHRMessage(jqXHR, 'There was a problem.');
            add_page_alert('danger', message);
        });
	}
	
	self.declineInvite = function(invite)
	{
	    //alert("declineInvite called...");
	    var decline_invite = confirm('Are you sure you want to decline this invitation?');
		if (!decline_invite) return;
	    console.log("decline new invite..." + invite.id);	
	    ajaxRequest(VILFREDO_API + '/users/'+ self.userid() +'/new_invites/'+invite.id+'/decline', 'POST').done(function(data, textStatus, jqXHR) {
		    console.log('Invite declined...');
		    self.new_invites.remove(invite);
		}).fail(function(jqXHR, textStatus, errorThrown)
		{
		    var message = getJQXHRMessage(jqXHR, 'There was a problem.');
            add_page_alert('danger', message);
        });
	}
	
	self.isLoggedIn = ko.computed(function() {
        console.log('isLoggedIn...' + this.userid());
		return this.userid() != 0;
    }, this);

	self.isLoggedOut = ko.computed(function() {
        console.log('isLoggedOut...' + this.userid());
		return this.userid() == 0;
    }, this);

    self.openLoginBox = function() // herring
    {
        console.log("Calling loginViewModel.open()...");
        loginViewModel().open();
    }

    self.openRegisterBox = function() // herring
    {
        console.log("Calling loginViewModel.open()...");
        registerViewModel().open();
    }


    // cat
	self.login = function(username, password, remember) {
		self.username(username);
		self.password = password;
		self.login_jqXHR = self.getAuthToken();
    }

    self.home = function()
    {
        window.location.replace(VILFREDO_URL);
    }

	self.logout = function()
	{
		console.log("User logged out...");
		self.username("");
		self.password = "";
		self.authToken = '';
		self.user = false;
		self.userid(0);
		$.cookie('vgaclient', null, { path: '/' });
		//proposalsViewModel.fetchProposals();
		//resetGraphsAfterLogout();
		if (typeof(questionsViewModel) != 'undefined')
		{
		    questionsViewModel.questions([]);
		}
		if (typeof(proposalsViewModel) != 'undefined')
		{
		    proposalsViewModel.clearData();
		}
		window.location.replace(VILFREDO_URL);
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
	
	self.uploadAvatar = function()
	{
        var data = new FormData();
        var file = $('#avatar_file_selector')[0].files[0];
        if (typeof(file) == 'undefined')
        {
            return;
        }
        data.append('avatar', file);

        var URI = VILFREDO_API +'/upload_avatar';
        var request = {
		    url: URI,
            type: 'POST',
            contentType: false,
            processData: false,
            async: false,
            cache: false,
            data: data,
            xhr: function() 
            { 
                myXhr = $.ajaxSettings.xhr();
                // check if upload property exists
                if(myXhr.upload){ 
                    // for handling the progress of the upload
                    myXhr.upload.addEventListener('progress', updateProgress, false);
                }
                return myXhr;
            },
            beforeSend: function (xhr) {
    			if (self.authToken != '')
    			{
    				//console.log("Use the auth token " + currentUserViewModel.authToken);
    				xhr.setRequestHeader('Authorization',
    					"Basic " + btoa(currentUserViewModel.authToken + ":" + ''));
    			}
    			else if (self.username() != '' && currentUserViewModel.password != '')
    			{
    				//console.log("Use login details");
    				xhr.setRequestHeader("Authorization",
                    	"Basic " + btoa(self.username() + ":" + self.password));
    			}
            },
            error: function(jqXHR) {
                console.log("ajax error " + jqXHR.status);
            }
        };
        
        $.ajax(request).done(function(data, textStatus, jqXHR) {
			console.log('CurrentUserViewModel.uploadAvatar');
			console.log(data);
			add_page_alert('success', 'Avatar set!');
			currentUserViewModel.avatar_url(data.url);
		}).fail(function(jqXHR) {
           var message = getJQXHRMessage(jqXHR, 'There was a problem uploading your file.');
           add_page_alert('danger', message);
        });
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
			.html("Oops, there was a server problem! We'll look into it.")
			.setAlertClass('danger')
			.fadeIn();
        });
	}

	self.getAuthToken = function() // jumpx
	{
		var URI = VILFREDO_API +'/authtoken';		
		$.cookie('vgaclient', null, { path: '/' });
		self.authToken = '';
		var email_invite_token = getQueryVariable('eit');
		params = {};
		if (email_invite_token)
		{ 
		    params = { 'eit': email_invite_token };
		}
		
		$('#login_btn').prop('disabled', true);
		
		return ajaxRequest(URI, 'POST', params).done(function(data, textStatus, jqXHR) {
		    self.authToken = data.token;
		    $('#login_btn').prop('disabled', false);
			loginViewModel().close();
			console.log('CurrentUserViewModel.getAuthToken:: Authtoken returned...');
			console.log(data);
			// Always remember login - for now
			$.cookie('vgaclient', data.token, {expires: 365, path: '/'});
			
			// Make sure we're on the question page or the home page wgen we log in
			if (typeof(data.question_url) != 'undefined')
			{
			    var message = 'You can now participate in this question!';
                $.cookie('vgamessage', message, { path: '/' });
    			$.cookie('vgastatus', 'success', { path: '/' });
			    window.location.replace(VILFREDO_URL + data.question_url);
			}
			else if (window.location.pathname != '/')
    		{
    		    window.location.replace(VILFREDO_URL); // jumpx
    		}
    		self.fetchCurrentUser();
		}).fail(function(jqXHR, textStatus, errorThrown) {
		    $('#login_btn').prop('disabled', false);
		    if (errorThrown == 'abort')
		    {
		        console.log("Login aborted...");
		        return;
		    }
		    if (jqXHR.responseJSON && jqXHR.responseJSON.user_message)
		    {
		        $('#login .message').text(jqXHR.responseJSON.user_message).fadeIn(500);
		    }
            else
            {
            	$('#login .message').text('Sorry, your login details were not recognised.').fadeIn(500);
            }
        });
	}
	self.fetchCurrentUser = function()
	{
		var URI = VILFREDO_API + '/currentuser';
		return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR)
		{
		    console.log('Current user data returned...');
			console.log(data);
			self.userid(parseInt(data.user.id));
			console.log('fetchCurrentUser:: User ID set ==> ' + self.userid());
			self.user = data.user;
			self.username(data.user.username);
			self.avatar_url(data.user.avatar_url)

			if (currentUserViewModel.isLoggedIn())
			{
			    if (typeof(questionsViewModel) != 'undefined')
		    	{
    			    questionsViewModel.fetchQuestions();
    			}
			    currentUserViewModel.fetchNewInvites();
			}

			if (proposalsViewModel)
			{
			    console.log("fetchCurrentUser: Question Phase = " + questionViewModel.phase());
			    if (questionViewModel.phase() == 'writing')
			    {
			        console.log('fetchCurrentUser: Fetching user only proposals');
			        proposalsViewModel.fetchProposals({user_only: true});
			    }
			    else if (questionViewModel.phase() == 'voting')
			    {
			        console.log('fetchCurrentUser: Fetching all proposals');
			        proposalsViewModel.fetchProposals();
			    }
			    //resetGraphsForUser();
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

function NewQuestionViewModel()
{
    var self = this;
    self.title = ko.observable('').extend({ required: true, maxLength: 100, minLength:1 });
    self.blurb = ko.observable('').extend({ required: true, maxLength: 10000, minLength:1 });
    self.created = ko.observable(false);
    self.id = ko.observable(0);
    self.question_type = ko.observable(1);
    self.voting_type = ko.observable(1);
    self.permissions = ko.observable(7);
    
    self.questionPermissions = ko.observableArray([
       {name: "Read", id: 1},
       {name: "Vote", id: 3},
	   {name: "Propose", id: 5},
	   {name: "Vote, Propose", id: 7}
    ]);
    
    self.selectedPermissions = 7;
    
    self.questionTypes = ko.observableArray([
       {name: "Standard", id: 1},
       {name: "Image", id: 2}
    ]);
    self.votingTypes = ko.observableArray([
       {name: "Triangle", id: 1},
       {name: "Linear", id: 2}
    ]);


    self.clear = function()
    {
        self.resetform();
    }
    
    self.select_permissions = function(permissions, $data)
    {
        self.permissions(permissions);
    }
    
    self.select_question_type = function(question_type, $data)
    {
        self.question_type(question_type);
    }
    self.show_question_type = ko.computed(function() {
        if (self.question_type() == 'image')
        {
		    return 'Image Only';
		}
		else if (self.question_type() == 'standard')
		{
		    return 'Standard';
		} 
    }, this);
    
    self.gotopage = function()
    {
        window.location.replace(VILFREDO_URL+"/question/"+self.id());
    }

    self.resetform = function()
    {
		console.log("NewQuestionViewModel.resetform() called ...");
        self.title('');
        self.blurb('');
        self.questionPermissions(7);
        self.question_type(1);
        self.voting_type(1);
        self.permissions(7);
        self.title.isModified(false);
        self.blurb.isModified(false);
        $('#addquestion .alert').css('display', 'none').html('');
        $("#addquestion .form-control").trigger( "setcharcount" );
    }
    self.close = function()
    {
        console.log("NewQuestionViewModel.close() called ...");
        //self.resetform();
        $('#addquestion').modal('hide');
    }

	self.addQuestion = function()
	{
		console.log("NewQuestionViewModel.addQuestion() called...");
		
		var content;
		if (USE_MARKDOWN_IN_QUESTION_TEXT)
		{
		    content = $("#inputQuestionBlurb").data('markdown').parseContent();
		}
		else
		{
		    content = Autolinker.link(self.blurb());
		}
		
		// Check link count
		//var content = Autolinker.link(self.blurb());
		//var content = $("#inputQuestionBlurb").data('markdown').parseContent();
		//console.log("Content = " + content);
		
		var numlinks = (content.match(/http/g) || []).length;
		var recaptcha = $('#g-recaptcha-response').val();
		if (numlinks > MAX_LINKS_IN_QUESTION && (recaptcha == undefined || recaptcha.length == 0))
		{
			$('#addquestion .recaptcha').show();
		    return;
		}
		console.log(numlinks + " links found. OK!!!");
		
		var question = {
            title: self.title(),
            blurb: content,
            permissions: self.permissions(),
            question_type: self.question_type(),
            voting_type: self.voting_type(),
            recaptcha: recaptcha
        };
		//console.log(question);
		//var question = new FormData($('#newquestionform')[0]);
		
		var URI = VILFREDO_API + '/questions';
		ajaxRequest(URI, 'POST', question).done(function(data, textStatus, jqXHR) {
		    //console.log('Add question data returned...');
			//console.log(data);

			if (jqXHR.status == 201)
			{
		  		// Question added - show permissions modal
		  		$.cookie('vganewquestion', data.question.id, { path: '/' });
		  		window.location.replace(VILFREDO_URL+"/question/"+data.question.id);
		  		/*
		  		question_id = data.question.id;
		  		self.id(data.question.id);
		  		self.created(true);
		        var message = "You're new question \"" + data.question.title + "\" was created!";
                add_page_alert('success', message);
                $('#addquestion .recaptcha').hide();
		  		$.when(questionViewModel.fetchQuestion()).done(function()
		        {
		  		    permissionsViewModel.open_permissions();
		  		});*/
			}
			else
			{
				console.log(jqXHR.status);
				var message = getJQXHRMessage(jqXHR, 'There was a problem adding your question');
				add_form_alert('addquestion_error', 'danger', message);
			}
		}).fail(function(jqXHR) {
            console.log('addQuestion: There was an error. Error ' + jqXHR.status);
            // Set alert
            var message = getJQXHRMessage(jqXHR, 'There was a problem adding your question');
			add_form_alert('addquestion_error', 'danger', message);
        });
	}
}

function RegisterViewModel()
{
    var self = this;
    self.username = ko.observable('').extend({ required: true, maxLength: 50, minLength:2 });
    self.password = ko.observable('').extend({ required: true, maxLength: 60, minLength:6 });
    self.email = ko.observable('').extend({ required: true, maxLength: 50, minLength:5, email: true });
    self.register_jqXHR = null;

    self.clear = function()
    {
        self.reset();
    }

    self.reset = function()
    {
		self.username('');
        self.password('');
        self.email('');
        $('#register .alert').css('display', 'none').html('');
        self.username.isModified(false);
        self.password.isModified(false);
        self.email.isModified(false);
        $('#register_btn').prop('disabled', false);
        // Abort ajax call if started
		if (self.register_jqXHR)
		{
		    self.register_jqXHR.abort();
		    self.register_jqXHR = null;
		}
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

    self.open = function()
	{
		console.log("RegisterViewModel.open() called...")
		if(jQuery.cookieBar('cookies') == false)
        {
        	add_page_alert('info', 'You must accept cookies to log in and use this site.', 'cookie_alert');
        	return;
        }

		$('#register .message').text('').hide();
		self.username('');
		self.password('');
		self.email('');
		var email = getQueryVariable('email');
		// winter
		if (email)
		{
		    self.email(email);
		}
		self.username.isModified(false);
		self.password.isModified(false);
		self.email.isModified(false);
		$('#register').modal('show');
	}

    // winter
    self.register = function() {
		$('#register .message').text('').fadeOut(100);
		if (self.username() == '' || self.password() == '' || self.email() == '')
		{
			$('#register .message').text('You have not completed all the required fields.')
			.addClass('alert-danger')
			.fadeIn(500);
			return;
		}
		$('#register_btn').prop('disabled', true);
        var new_user = {username: self.username(), password: self.password(), email: self.email()};
        
        // Add an email_invite_token if available
        var email_invite_token = getQueryVariable('eit');
		if (email_invite_token)
		{ 
		    new_user['eit'] = email_invite_token;
		}
        
        self.register_jqXHR = ajaxRequest(VILFREDO_API + '/users', 'POST', new_user).done(function(data, textStatus, jqXHR)
		{
		    console.log('Register: data returned...');
			console.log(data);
			$('#register_btn').prop('disabled', false);

			if (jqXHR.status == 201)
			{
				registerViewModel().close();

				if (typeof(data.token) != 'undefined')
				{
				    currentUserViewModel.authToken = data.token;
        			console.log('RegisterViewModel.register:: Authtoken returned...');
        			console.log(data);
        			$.cookie('vgaclient', data.token, {expires: 365, path: '/'});
        			
        			// Make sure we're on the question page or the home page wgen we log in
        			if (typeof(data.question_url) != 'undefined')
        			{
        			    var message = 'You can now participate in this question!';
                        $.cookie('vgamessage', message, { path: '/' });
            			$.cookie('vgastatus', 'success', { path: '/' });
        			    window.location.replace(VILFREDO_URL + data.question_url);
        			}
        			else if (window.location.pathname != '/')
            		{
            		    window.location.replace(VILFREDO_URL);
            		}
            		currentUserViewModel.fetchCurrentUser();
            		add_page_alert('success', 'Welcome to Vilfredo. You can now participate in this question!');
				}
				else if (typeof(data.activation_email_sent) != 'undefined' && data.activation_email_sent == true) 
				{
				    add_page_alert('success', 'Thank you. An email with an account activation link has been sent to your address.');
				}
				else
				{
				    add_page_alert('info', 'Something odd seems to have happened. Please be patient while we look into it.');
				}
			}
			else
			{
				console.log("RegisterViewModel.register failed with status " + jqXHR.status);
				$('#register .alert')
				.html(data.message)
				.setAlertClass('danger')
				.fadeIn();
			}
		}).fail(function(jqXHR, textStatus, errorThrown)
		{
		    $('#register_btn').prop('disabled', false);
		    if (errorThrown == 'abort')
		    {
		        console.log("Register aborted...");
		        return;
		    }
            var message = getJQXHRMessage(jqXHR, 'There was a problem with your registrations');
            $('#register .alert')
			.html(message)
			.setAlertClass('danger')
			.fadeIn();
        });
    }
}

function NewPasswordViewModel()
{
    var self = this;
    self.token = getQuerySegment('resetpwd');
    self.password = ko.observable('').extend({
        required: true,
        minlength: 6,
        message: "Password is required",
        maxLength: 60
    });

    self.confirmpassword = ko.observable('');

    self.setnewpassword = function()
    {
        if (self.checkEqual())
        {
            var URI = VILFREDO_API +'/reset_password';
    		$.cookie('vgaclient', null, { path: '/' });
    		var passwords = {'password': self.password() , 'password2': self.confirmpassword(), 'token': self.token};
    		return ajaxRequestPR(URI, 'POST', passwords).done(function(data, textStatus, jqXHR) {
    			// badger
    			if (jqXHR.status != 201)
			    {
				    console.log(data.message);
				    add_page_alert('danger', data.message);
				}
				else
				{
				    $.cookie('vgaclient', data.token, {expires: 365, path: '/'});
    			    add_page_alert('success', 'Your password has been reset. Click here to continue <a class="home" href="">Home</a>');
    			    $('.home').attr('href', VILFREDO_URL);
    			    //$('#enter_password').fadeOut(400);
    			    $('#enter_password').find('input').val('');
				}

    		}).fail(function(jqXHR) {
               if (jqXHR.status == 403)
    		    {
    				console.log('Password reset failed.');
    				add_page_alert('danger', 'Oops! Something went wrong.');
    			}
            });
        }
    }

    self.checkEqual = function()
    {
        if (self.password() != self.confirmpassword())
        {
            $('#confirmpwd').text('The passwords you enter must be the same');
            self.confirmpassword('');
            return false;
        }
        else
        {
            $('#confirmpwd').text('');
            return true;
        }
    }
}

function PasswordResetViewModel() // wolf
{
    var self = this;
    self.email = ko.observable('').extend({ required: true, maxLength: 50, minLength:5, email: true });

	self.done = function()
	{
	    self.email('');
	    self.email.isModified(false);
	    $('#reset_pwd .alert').text('').fadeOut(100);
	    $('#reset_pwd').modal('hide');
	}
	self.reset = function()
	{
		console.log("LoginViewModel.reset called...");

		$('#login .message').text('').fadeOut(100);
		if (self.email() == '')
		{
			$('#reset_pwd .message').text('You must enter your email address.')
			    .fadeIn(500)
    			.delay(5000)
    			.fadeOut(500);
			return;
		}

		var URI = VILFREDO_API + '/request_password_reset';
		ajaxRequestPR(URI, 'POST', {'email': self.email()}).done(function(data, textStatus, jqXHR) {
			if (jqXHR.status == 201)
			{
	  		    self.done();
	  		    add_page_alert('success', 'An email has been sent to your address with instructions on how to reset your password.', 'reset-email-sent');
	  		}
	  		else
			{
				console.log(jqXHR.status);
				$('#reset_pwd .alert')
				.text(data.error)
				.setAlertClass('danger')
				.fadeIn();
			}
		}).fail(function(jqXHR) {
            console.log('pwd_reset: There was an error. Error ' + jqXHR.status);
            $('#reset_pwd .alert')
            .text(JSON.parse(jqXHR.responseText).message)
            .setAlertClass('danger')
            .fadeIn();
        });
	}
}

function LoginViewModel()
{
    var self = this;
    self.username = ko.observable('');
    self.password = ko.observable('');
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

    self.logEnter = function(data, e)
    {
        if(e.which == 13)
        {
            self.dologin();
            return true;
        }
        else
        {
            return true;
        }
    }

	self.logout = function()
	{
		console.log("logout  called...");
		self.username = "";
		self.password = "";
		self.currentuser("");
		self.username.isModified(false);
		self.password.isModified(false);
		window.location.replace('index.html');
	}
	self.open = function() // winter
	{
		console.log("LoginViewModel.open() called...")
		if(jQuery.cookieBar('cookies') == false)
        {
        	add_page_alert('info', 'You must accept cookies to log in and use this site.', 'cookie_alert');
        	return;
        }

		$('#login .message').text('').hide();
		self.username('');
		self.password('');
		//self.username.isModified(false);
		//self.password.isModified(false);
		$('#login').modal('show');
	}
	self.clear = function()
	{
		console.log("LoginViewModel clear called...");
		self.username('');
		self.password('');
		self.username.isModified(false);
		self.password.isModified(false);
	}
	self.close = function()
	{
		console.log("LoginViewModel close called..."); // jumpx
		$('#login .message').text('').hide();
		self.username('');
		self.password('');
		self.username.isModified(false);
		self.password.isModified(false);
		$('#login_btn').prop('disabled', false);
		$('#login').modal('hide');
		// Abort ajax call if started
		if (currentUserViewModel.login_jqXHR)
		{
		    currentUserViewModel.login_jqXHR.abort();
		    currentUserViewModel.login_jqXHR = null;
		}
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

// bang
function AddProposalViewModel()
{
    var self = this;
    self.title = ko.observable('').extend({ required: true, maxLength: 120, minLength: { params: 2, message: "Please make sure your title clearly summarizes your proposal!" } });
    
    //self.abstract = ko.observable('').extend({ maxLength: 5000 });
    //self.blurb = ko.observable('').extend({ required: true, maxLength: 10000, minLength: 25 });
    
    self.abstract = ko.observable('');
    self.blurb = ko.observable('');
    
    self.add_proposal_jqXHR = null;
    
    self.abstract_length_pc = ko.computed(function() {
        return '' + Math.round(self.abstract().length / 50) + '%';
    });
    self.blurb_length_pc = ko.computed(function() {
        return '' + Math.round(self.blurb().length / 100) + '%';
    });
    
    self.readImageURL = function(input) 
    {
        console.log('AddProposalViewModel.readImageURL called AGAIN!!!....');
        if (input.files && input.files[0]) 
        {
            $('#proposal_image_placeholder').hide();
            var reader = new FileReader();
            var image  = new Image();
            
            reader.readAsDataURL(input.files[0]);
            reader.onload = function (_file) 
            {
                image.src    = _file.target.result;
                image.onload = function() 
                {
                    var w = this.width;
                    console.log('w = ' + w);
                    var h = this.height;
                    console.log('h = ' + h);
                    var max = Math.max(w, h);
                    console.log('max = ' + max);
                    var show_w = w / max * 200;
                    console.log('show_w = ' + show_w);
                    var show_h = h / max * 200;
                    console.log('show_h = ' + show_h);
            
                    $('#selected_proposal_image')
                        .attr('src', image.src)
                        .width(show_w)
                        .height(show_h);
                };
            };
        }
    }

    self.open_addproposal_modal = function()
    {
        if (questionViewModel.question_type() == 1)
        {
            self.abstract.extend({ maxLength: 5000 });
            self.blurb.extend({ required: true, maxLength: 10000, minLength: 25 });
        }
        $('#addproposal').modal('show');
    }
    
    self.addProposal = function() // bang
    { 
        $('#addproposal .alert').text('').fadeOut(100);
        
        if (self.add_proposal_jqXHR != null)
        {
            return;
        }
        
        console.log("Title = " + self.title());
        
        if (questionViewModel.question_type() == 1)
        {
		    if (self.title() == '' || self.blurb() == '')
    		{
    			$('#addproposal .alert').text('You have not completed all the required fields.')
    			.fadeIn(500);
    			return;
    		}
            self.add_proposal_jqXHR = proposalsViewModel.add({
                title: self.title(),
    			abstract: self.abstract(),
                blurb: self.blurb()
            });
        }
        else if (questionViewModel.question_type() == 2)
        {
            var file = $('#image_file_selector')[0].files[0];
            console.log(file.name);
            if (self.title() == '' || typeof(file) == 'undefined')
    		{
    			$('#addproposal .alert').text('You have not completed all the required fields.')
    			.fadeIn(500);
    			return;
    		}
    		// bang
            //proposalsViewModel.addImageProposal(self.title(), file);
            var formdata = new FormData($('#newpropform')[0]);
            proposalsViewModel.addImageProposal(formdata);
        }
    }
    
    self.clear = function() // yob
	{
		console.log("Clearing addproposal modal!!!");
		$('#addproposal .alert').text('').hide();
		self.title('');
		self.abstract('');
		self.blurb('');
		self.title.isModified(false);
		self.abstract.isModified(false);
		self.blurb.isModified(false);
		$("#addproposal .form-control").trigger( "setcharcount" );
		
		$('#selected_proposal_image')
                .attr('src', '').width(0).height(0);
		var control = $("#image_file_selector");
		control.replaceWith( control = control.clone( true ) );
		
		var placeholder = $('#proposal_image_placeholder');
		if (placeholder.length)
		{
			placeholder.show();
		}
	}
	self.close = function()
	{
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

	self.add = function() // eating
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

// chat
function EditQuestionViewModel()
{
    var self = this;
    self.question;
    self.storedQuestion = amplify.store( "editquestion" );
    self.title = ko.observable(self.storedQuestion.title).extend({ required: true, maxLength: 120, minLength:1 });
    
    var markdown_text = toMarkdown(self.storedQuestion.blurb);
    self.blurb = ko.observable().extend({ required: true, maxLength: 10000, minLength: 1 });
    if (USE_MARKDOWN_IN_QUESTION_TEXT == false)
    {
        self.blurb(self.storedQuestion.blurb);
    }
    
    self.id = ko.observable(self.storedQuestion.id);
    self.question_type = ko.observable(self.storedQuestion.question_type);
    self.voting_type = ko.observable(self.storedQuestion.voting_type);
    self.permissions = ko.observable(self.storedQuestion.permissions);
    
    
    self.questionPermissions = ko.observableArray([
       {name: "Read", id: 1},
       {name: "Vote", id: 3},
	   {name: "Propose", id: 5},
	   {name: "Vote, Propose", id: 7}
    ]);
    
    self.selectedPermissions = self.storedQuestion.permissions;
    
    self.questionTypes = ko.observableArray([
       {name: "Standard", id: 1},
       {name: "Image", id: 2}
    ]);
    self.votingTypes = ko.observableArray([
       {name: "Triangle", id: 1},
       {name: "Linear", id: 2}
    ]);
    
    self.parseBlurbToMarkup = function()
    {
        var markdown_text = toMarkdown(self.storedQuestion.blurb);
		self.blurb(markdown_text);
		$("#inputQuestionBlurb").trigger( "setcharcount" );
    }
	
	self.setQuestion = function(question)
	{
		//self.title(self.storedQuestion.title);
		
		
		/*
		self.question = question;
		self.title(question.title());
		self.blurb(question.blurb());
		*/
	}
	
	self.cancel = function()
	{
	    // Clear cache
	    amplify.store( "editquestion", null );
	    // Go back to question
	    window.location.replace(VILFREDO_URL+"/question/"+self.id());
	}
	
	self.close = function()
	{
	    self.question = null;
		self.title('');
		self.blurb('');
	    $('#editquestion').modal('hide');
	}
	self.show = function()
	{
	    $('#editquestion').modal('show');
	}
	self.updateQuestion = function() 
	{
        $('#editquestion .alert').text('').fadeOut(100);
		if (self.title() == '' || self.blurb() == '')
		{
			$('#editquestion .alert').text('You have not completed all the required fields.')
			.fadeIn(500);
			return;
		}
		
		var content;
		if (USE_MARKDOWN_IN_QUESTION_TEXT)
		{
		    content = $("#inputQuestionBlurb").data('markdown').parseContent();
		}
		else
		{
		    content = Autolinker.link(self.blurb());
		}
		
		// Check link count
		// var content = Autolinker.link(self.blurb());
		//var content = $("#inputQuestionBlurb").data('markdown').parseContent();
		
		var numlinks = (content.match(/http/g) || []).length;
		var recaptcha = $('#g-recaptcha-response').val();
		if (numlinks > MAX_LINKS_IN_QUESTION && (recaptcha == undefined || recaptcha.length == 0))
		{
			$('#editquestion .recaptcha').show();
		    return;
		}
		console.log(numlinks + " links found. OK!!!");
		
		var updates = {
            title: self.title(),
            blurb: content,
            permissions: self.permissions(),
            question_type: self.question_type(),
            voting_type: self.voting_type(),
            recaptcha: recaptcha
        };
		
		var EDIT_URL = VILFREDO_API + '/questions/' + self.id();
	    console.log('updateQuestion called...');
	    ajaxRequest(EDIT_URL, 'POST', updates).done(function(data) {
		    // Clear cache
		    amplify.store( "editquestion", null );
		    // Goto question
		    window.location.replace(VILFREDO_URL+"/question/"+self.id());
		    /*
		    console.log(data);
		    $('#editquestion .recaptcha').hide();
		    self.question.title(self.title());
		    self.question.blurb(self.blurb());
		    self.close();
		    */
		}).fail(function(jqXHR, textStatus, errorThrown)
		{
			console.log('editproposal: There was an error editing the question. Status: ' + textStatus); // maison
            var message = getJQXHRMessage(jqXHR, 'There was a problem updating your question');
            $('#editquestion .alert')
			.text(message)
			.setAlertClass('danger')
			.fadeIn();
        });
    }
}


// maison
function EditProposalViewModel()
{
    var self = this;
    self.proposal;
	self.title = ko.observable('');
    self.abstract = ko.observable('').extend({ maxLength: 5000 });
    self.blurb = ko.observable('');
    self.abstract_length_pc = ko.computed(function() {
        return '' + Math.round(self.abstract().length / 50) + '%';
    });
    self.blurb_length_pc = ko.computed(function() {
        return '' + Math.round(self.blurb().length / 100) + '%';
    });
	self.index;
	self.proposal_id = ko.observable();
	self.image_url = ko.observable();
	self.image_changed = ko.observable(false);

	self.setProposal = function(proposal)
	{
		self.proposal = proposal;
		self.title(proposal.title());
		self.abstract(proposal.abstract());
		self.blurb(proposal.blurb());
		self.proposal_id = proposal.id();
		self.image_url(proposal.image_url);
	}
	self.close = function() // yob
	{
	    self.proposal = null;
		self.title('');
		self.abstract('');
		self.blurb('');
	    $('#editproposal').modal('hide');
	    self.image_changed(false);
	    $('#edit_proposal_image')
                .attr('src', '').width(0).height(0);
		var control = $("#edit_image_file_selector");
		control.replaceWith( control = control.clone( true ) );
		
		var placeholder = $('#proposal_image_placeholder');
		if (placeholder.length)
		{
			placeholder.show();
		}
		$('#edit_proposal_current_image')
                .attr('src', '').width(0).height(0);
	}
	self.show = function()
	{
	    if (questionViewModel.question_type() == 1)
        {
            self.abstract.extend({ maxLength: 5000 });
            self.blurb.extend({ required: true, maxLength: 10000, minLength: 25 });
        }
	    $('#editproposal').modal('show');
	}
	
	self.readImageURL = function(input) 
    {
        console.log('AddProposalViewModel.readImageURL called AGAIN!!!....');
        if (input.files && input.files[0]) 
        {
            $('#edit_proposal_current_image').hide();
            $('#edit_proposal_image_placeholder').hide();
            var reader = new FileReader();
            var image  = new Image();
            
            reader.readAsDataURL(input.files[0]);
            reader.onload = function (_file) 
            {
                image.src    = _file.target.result;
                image.onload = function() 
                {
                    var w = this.width;
                    console.log('w = ' + w);
                    var h = this.height;
                    console.log('h = ' + h);
                    var max = Math.max(w, h);
                    console.log('max = ' + max);
                    var show_w = w / max * 200;
                    console.log('show_w = ' + show_w);
                    var show_h = h / max * 200;
                    console.log('show_h = ' + show_h);
            
                    $('#edit_proposal_image')
                        .attr('src', image.src)
                        .width(show_w)
                        .height(show_h);
                };
            };
        }
    }
	
	self.updateProposal = function() // bang here
	{
        $('#editproposal .alert').text('').fadeOut(100);
        
        // Check data entered
        if (questionViewModel.question_type() == 1)
        {
		    if (self.title() == '' || self.blurb() == '')
    		{
    			$('#editproposal .alert').text('You have not completed all the required fields.')
    			.fadeIn(500);
    			return;
    		}
		}
		else if (questionViewModel.question_type() == 2)
		{
    		//var file = $('#edit_image_file_selector')[0].files[0];
            //console.log(file.name);
            if (self.title() == '')
    		{
    			$('#editproposal .alert').text('You have not completed all the required fields.')
    			.fadeIn(500);
    			return;
    		}
		}
		var url = VILFREDO_API + '/questions/' + question_id + '/proposals/' + self.proposal.id();
		//formdata = new FormData($('#editproposalform')[0]);
		
		var formdata;
		
		if (questionViewModel.question_type() == 2)
		{
		    if (self.image_changed())
    		{
    		    console.log("EditProposalViewModel.updateProposal: Image changed: upload new one....");
    		    formdata = new FormData($('#editproposalform')[0]);
    		}
    		else
    		{
    		    console.log("EditProposalViewModel.updateProposal: Image unchanged: update title only....")
    		    formdata = new FormData();
    		    formdata.append('title', self.title());
    		}
    	}
    	else
    	{
    	    formdata = new FormData($('#editproposalform')[0]);
    	}

	    ajaxFormRequest(url, formdata).done(function(data) {
		    self.proposal.title(data.proposal.title);
		    self.proposal.abstract(data.proposal.abstract);
		    self.proposal.blurb(data.proposal.blurb);
		    self.proposal.image_url(data.proposal.image_url);
		    self.close();
		}).fail(function(jqXHR, textStatus, errorThrown)
		{
			console.log('updateProposal v2: There was an error editing the proposal. Status: ' + textStatus); // maison
            var message = getJQXHRMessage(jqXHR, 'There was a problem updating your proposal');
            $('#editproposal .alert')
			.text(message)
			.setAlertClass('danger')
			.fadeIn();
        });
    }
    
	self.updateProposal_v1 = function() 
	{
        $('#editproposal .alert').text('').fadeOut(100);
		if (self.title() == '' || self.blurb() == '')
		{
			$('#editproposal .alert').text('You have not completed all the required fields.')
			.fadeIn(500);
			return;
		}
		
		var EDIT_URL = VILFREDO_API + '/questions/' + question_id + '/proposals/' + self.proposal.id();
		var updates = {'title': self.title(), 'abstract': self.abstract(), 'blurb': self.blurb(), 'user_id': currentUserViewModel.userid()}
	    console.log('updateProposal called...');
	    ajaxRequest(EDIT_URL, 'POST', updates).done(function(data) {
		    console.log(data);
		    self.proposal.title(self.title());
		    self.proposal.abstract(self.abstract());
		    self.proposal.blurb(self.blurb());
		    self.close();
		}).fail(function(jqXHR, textStatus, errorThrown)
		{
			console.log('editproposal: There was an error editing the proposal. Status: ' + textStatus); // maison
            var message = getJQXHRMessage(jqXHR, 'There was a problem updating your proposal');
            $('#editproposal .alert')
			.text(message)
			.setAlertClass('danger')
			.fadeIn();
        });
    }
}

function ViewProposalViewModel()
{
	var self = this;
	self.proposal;
	self.id = ko.observable();
	self.title = ko.observable();
	self.blurb = ko.observable();
	self.author = ko.observable();
	self.endorse_type = ko.observable();
	self.comments = ko.observableArray();
	self.author_id = ko.observable();
	self.image_url = ko.observable();
	self.index;

	self.comment_for = ko.observable('');
	self.comment_against = ko.observable('');
	self.question = ko.observable('');
	self.answer = ko.observable('');

	self.addcommentanswer = function(comment_id) // today
		{
			console.log("addcommentanswer called with id " + comment_id);
			var answer = $.trim($('.inputAnswerComment').filter(function() {
				return $(this).data("commentid") == comment_id;
			}).val());
			console.log(answer);
			if ( answer != '' )
			{
				viewProposalViewModel.addComment({
	                comment: answer,
	                comment_type: 'answer',
					reply_to: comment_id
	        	});
			}
		}


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
	}
	
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
	}

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
    }
    
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
    }

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
    }

    self.addNewComment = function(comment, type, reply_to) // eating
	{
		console.log("ViewProposalViewModel.addComment() called ...");
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
		//newCommentViewModel().resetNewCommentPanel();
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
		//newCommentViewModel().resetNewCommentPanel();
		var $showing = $('#propdetails, #showquestions').filter(function() {
		   return $(this).is(':visible');
	    });
	    if ($showing.length)
	    {
		    $showing.fadeOut(function()
    		{
    			$('#showcomments').fadeIn();
    		});
    	}
    	else
    	{
    	    $('#showcomments').fadeIn();
    	}
	}
	self.showProposalQuestions = function()
	{
		//newCommentViewModel().resetNewCommentPanel();
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
				comment.num_supporters(data.num_supporters);
			}
			else
			{
				console.log(jqXHR.status);
			}
		});
	}

	self.submitComment = function(comment_type, proposal)
    {
	    console.log(proposal.id());
	    console.log(comment_type);

        switch (comment_type)
        {
            case "for":
               console.log('Adding comment for');
               self.addComment({
	                comment: $.trim(self.comment_for()),
	                comment_type: 'for',
					reply_to: 0
			   });
               break;
            case "against":
               console.log('Adding comment against');
               self.addComment({
	                comment: $.trim(self.comment_against()),
	                comment_type: 'against',
					reply_to: 0
			   });
               break;
               case "question":
               console.log('Adding question');
               self.addComment({
	                comment: $.trim(self.question()),
	                comment_type: 'question',
					reply_to: 0
			   });
               break;
            default:
               console.log('Unknown comment type');
               return;
        }
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
				console.log('Updating comments list for propsalal' + self.proposal.id());
				self.comments.push({
		      		id: ko.observable(data.comment.id),
					comment: ko.observable(data.comment.comment),
		      		comment_type: ko.observable(data.comment.comment_type),
		      		created: ko.observable(data.comment.created),
					reply_to: ko.observable(data.comment.reply_to),
					author_id: ko.observable(data.comment.author_id),
					num_supporters: ko.observable(data.comment.num_supporters),
					supporters: ko.observableArray(JSON.parse(data.comment.supporters))
		  		});

		  		console.log("Clear comment input box");
		  		// Clear comment input box
		  		switch (data.comment.comment_type)
		  		{
		  		    case "for":
		  		        self.comment_for('');
		  		        break;
		  		    case "against":
		  		        self.comment_against('');
		  		        break;
		  		    case "question":
		  		        self.question('');
		  		        break;
		  		}
		  		
		  		$('#viewproposal .alert')
			    .text('')
    			.fadeOut();

		  		// Update counts
		  		var index = getItemIndexFromArrayWithID(proposalsViewModel.proposals(), self.id());
		  		if (index != -1)
		  		{
		  		    proposalsViewModel.proposals()[index].comment_count(parseInt(data.comment.comment_count));
		  		    proposalsViewModel.proposals()[index].question_count(parseInt(data.comment.question_count));
		  		}

		  		index = getItemIndexFromArrayWithID(proposalsViewModel.inherited_proposals(), self.id());
		  		if (index != -1)
		  		{
		  		    proposalsViewModel.inherited_proposals()[index].comment_count(parseInt(data.comment.comment_count));
		  		    proposalsViewModel.inherited_proposals()[index].question_count(parseInt(data.comment.question_count));
		  		}
			}
			else
			{
				console.log('addcomment: There was an error with add comment. Status ' + jqXHR.status);
    			$('.newcommentpanel .alert')
    			.html("There was an problem adding the comment.")
    			.setAlertClass('danger')
    			.fadeIn();
			}
		}).fail(function(jqXHR, textStatus, errorThrown)
		{
			console.log('addcomment: There was an error with add comment. Status: ' + textStatus); // today
            var message = getJQXHRMessage(jqXHR, 'There was a problem adding your comment');
            $('#viewproposal .alert')
			.text(message)
			.setAlertClass('danger')
			.fadeIn();
        });
	}

	self.setIndex = function(index)
	{
		self.index = index;
	}

	
	self.openvotemap = function() // ViewProposalViewModel
	{ 
		if (questionViewModel.phase() != 'voting') return;
		//var index = proposalsViewModel.getProposalIndex(proposal.id()); // booms
		voteMapViewModel.proposal = self.proposal;
		//voteMapViewModel.proposal_index(index);
		voteMapViewModel.proposal_id(self.proposal.id());
		voteMapViewModel.endorse_type(self.proposal.endorse_type());
		$('#votemap-thisprop').html(self.proposal.title());
		$('#votemapwindow').modal('show');
	}

	self.setProposal = function(proposal)
	{
		self.proposal = proposal;
		self.id(proposal.id());
		self.title(proposal.title());
		self.blurb(proposal.blurb());
		self.author(proposal.author());
		self.image_url(proposal.image_url);
		self.author_id(proposal.author_id());
		self.endorse_type(proposal.endorse_type());
		self.comments([]);
		self.fetchComments();
	}
	/*
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
	}*/

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
			var fetched_comments = [];
			for (var i = 0; i < data.comments.length; i++) {
		  		var supporters = JSON.parse(data.comments[i].supporters)
				fetched_comments.push({
		      		id: ko.observable(data.comments[i].id),
					comment: ko.observable(data.comments[i].comment), // fordy
		      		comment_type: ko.observable(data.comments[i].comment_type),
		      		created: ko.observable(data.comments[i].created),
					reply_to: ko.observable(data.comments[i].reply_to),
					author_id: ko.observable(data.comments[i].author_id),
					num_supporters: ko.observable(data.comments[i].num_supporters),
					supporters: ko.observableArray(JSON.parse(data.comments[i].supporters))
		  		});
			}
			self.comments(fetched_comments);
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
				newQuestionViewModel().clear();
				window.location.replace(VILFREDO_URL+"/question/"+data.question.id+"?new=true");
		  		
		  		// Question added - show permissions modal
		  		/*
		  		question_id = data.question.id;
		  		newQuestionViewModel().id(data.question.id);
		  		newQuestionViewModel().created(true);
		        var message = "You're new question \"" + data.question.title + "\" was created!";
                add_page_alert('success', message);
		  		$.when(questionViewModel.fetchQuestion()).done(function()
		        {
		  		    permissionsViewModel.open_permissions();
		  		});*/
			}
			else
			{
				console.log(jqXHR.status);
				var message = getJQXHRMessage(jqXHR, 'There was a problem adding your question');
				add_page_alert('danger', message);
			}
		}).fail(function(jqXHR) {
            console.log('addQuestion: There was an error. Error ' + jqXHR.status);
            // Set alert
            var message = getJQXHRMessage(jqXHR, 'There was a problem adding your question');
			add_page_alert('danger', message);
        });
	}

	/*
	Fetch the questions which the user is permitted to see
	*/
    self.fetchQuestions = function() {
		if (currentUserViewModel.isLoggedOut()) return false;
		console.log("Fetching questions...");
		
		var url = VILFREDO_API + '/questions';
		// Test CORS
	    //var url = 'http://test.vilfredo.org' + '/questions';
		
		var room_query = (room) ? '?room=' + room : '';
		ajaxRequest(url+room_query, 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('Questions data returned...');
			console.log(data);
			self.questions([]);
			var fetched_qustions = [];
			for (var i = 0; i < data.questions.length; i++) {
		  		fetched_qustions.push({
		      		id: ko.observable(data.questions[i].id),
					title: ko.observable(data.questions[i].title),
		      		blurb: ko.observable(data.questions[i].blurb),
		      		author: ko.observable(data.questions[i].author),
					uri: ko.observable(data.questions[i].url),
					phase: ko.observable(data.questions[i].phase),
					question_type: ko.observable(data.questions[i].question_type),
					last_move_on : ko.observable(parseInt(data.questions[i].last_move_on)),
            		minimum_time : ko.observable(parseInt(data.questions[i].minimum_time)),
            		maximum_time : ko.observable(parseInt(data.questions[i].maximum_time)),
					author_id: ko.observable(parseInt(data.questions[i].author_id)),
					generation: ko.observable(parseInt(data.questions[i].generation)),
					proposal_count: ko.observable(parseInt(data.questions[i].proposal_count)),
					new_proposal_count: ko.observable(parseInt(data.questions[i].new_proposal_count)),
					new_proposer_count: ko.observable(parseInt(data.questions[i].new_proposer_count)),
            		participant_count: ko.observable(parseInt(data.questions[i].participant_count)),
            		voters_voting_count: ko.observable(parseInt(data.questions[i].voters_voting_count)),
            		completed_voter_count: ko.observable(parseInt(data.questions[i].completed_voter_count)),
            		finished_writing_count: ko.observable(data.questions[i].finished_writing_count),
					consensus_found: ko.observable(data.questions[i].consensus_found),
					inherited_proposal_count: ko.observable(parseInt(data.questions[i].inherited_proposal_count)),
					link: VILFREDO_URL + "/question/" + data.questions[i].id
		  		});
			}
			self.questions(fetched_qustions);
		});
	}
	
	// chat
	self.delete = function(index, question)
	{
		console.log("QuestionsViewModel.delete called with index " + index);
		var delete_question = confirm('Are you sure you want to delete this question?');
		if (!delete_question) return;
		
		var DELETE_URL = VILFREDO_API + '/questions/' + question.id();
	    console.log('delete question called...');
	    ajaxRequest(DELETE_URL, 'DELETE').done(function(data) {
		    console.log(data);
		    self.questions.remove(question);
		    add_page_alert('success', 'Question "' + question.title() + '" deleted.');
		}).fail(function(jqXHR, textStatus, errorThrown)
		{
			console.log('deleteproposal: There was an error editing the proposal. Status: ' + textStatus); // maison
            var message = getJQXHRMessage(jqXHR, 'There was a problem updating your proposal');
            add_page_alert('danger', message);
        });
	}
	
	// chat
	self.edit = function(index, question)
	{
		console.log("QuestionsViewModel.edit called with index " + index);
		editQuestionViewModel().setQuestion(question);
		editQuestionViewModel().show();
	}
	
	
	self.beginNewQuestion = function()
	{
	    console.log('begin_new_question');
	    //$('#addquestion').modal('show');
	    window.location.replace(VILFREDO_URL+"/newquestion");
	}
	
	self.is_new_question = function(question)
	{
	    return question.generation() == 1 && question.proposal_count() == 0;
	}
	
	
	/*
	"X out of Y participants submitted N proposals" for proposals and
    "X out of Y participants already voted" for voting and
    "X out of Y participants contributed" for results area.
	*/
	self.settooltip = function(question)
	{
	    var html = "<div>";
	    html = html + question.blurb().substr(0, 150) + '...</div>';
	    html = html + "<strong>Generation: " + question.generation() + "</strong><br>";
	    
	    if (question.phase() == 'writing')
	    {
    	    var complete = question.participant_count() == question.finished_writing_count();
	        if (complete)
	        {
	            html += "Great! All participants have finished writing!";
	            return html;
	        }
    	    
    	    if (question.new_proposal_count() > 0)
    	    {
    	        html = html + question.new_proposer_count() + ' out of ' + question.participant_count()
    	            + ' participants submitted ' + question.new_proposal_count() + ' proposals';
    	    }
    	    else
    	    {
    	        html = html + "<br>No new proposals so far. Be the first!";
    	    }
    	    if (question.inherited_proposal_count() > 0)
    	    {
    	        var total_props = question.new_proposal_count() + question.inherited_proposal_count();
    	        html = html + "<br>There are also "
    		        + question.inherited_proposal_count()
    		        + " inherited from the previous generation, so " +  total_props + " in total";
    	    }
	    }
	    else if (question.phase() == 'voting')
	    {
	        // Display how many have voted
	        var complete = question.participant_count() == question.completed_voter_count();
	        if (complete)
	        {
	            html += "Great! All participants have voted!";
	            return html;
	        }
	        
            var not_finished = question.voters_voting_count() - question.completed_voter_count();
            if (question.voters_voting_count() == 0)
    	    {
    	        html = html + "No one started voting. Be the first!";
    	    }
    	    else
    	    {
    	        html = html + "Out of " + question.participant_count() + ' participants';
        	    if (not_finished && question.completed_voter_count())
        	    {
        	        html = html + ", " + question.completed_voter_count() + " finished voting, " +  not_finished +  " started voting";
        	    }
        	    else if (question.completed_voter_count())
        	    {
        	        html = html + ", " + question.completed_voter_count() + " finished voting";
        	    }
        	     else if (not_finished)
        	    {
        	        html = html + ", " +  not_finished +  " started voting";
        	    }
	        }
	    }
	    else if (question.phase() == 'results')
	    {
    	    html = html + question.completed_voter_count() + ' out of ' + question.participant_count()
    	            + ' participants contributed';
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
    self.proposal;
    self.proposal_index = ko.observable();
    self.proposal_id = ko.observable();
    self.endorse_type = ko.observable();
}

function ProposalsViewModel()
{
    var self = this;

	// Voting and writing phase
	self.proposals = ko.observableArray();
	// Voting phase only
	self.key_players = ko.observableArray();
	// Writing phase only
	self.inherited_proposals = ko.observableArray();
	self.pareto = ko.observableArray(); // winning proposals (pareto front)

	self.clearData = function()
	{
	    self.proposals([]);
	    self.key_players([]);
	    self.inherited_proposals([]);
	}
	
	ko.bindingHandlers.scaleimage = 
	{
        'update': function(element, valueAccessor) {
            console.log('bindingHandler scaleimages called..');
            scaleProposalImage(element);
        }
    };

	self.hasVoted = ko.pureComputed(function() {
		var proposals = self.proposals();
		if (proposals.length == 0)
		{
		    return false;
		}
		for (var i = 0, j = proposals.length; i < j; i++)
		{
		    if (isNaN(proposals[i].mapx()) == false)
		    {
		        return true;
		    }
		}
		return false;
    });
	
	self.hasVotedAll = ko.pureComputed(function() {
		var proposals = self.proposals();
		if (proposals.length == 0)
		{
		    return false;
		}
		for (var i = 0, j = proposals.length; i < j; i++)
		{
		    if (isNaN(proposals[i].mapx()))
		    {
		        return false;
		    }
		}
		return true;
    });
    
    self.votedAll = ko.pureComputed(function() {
		var proposals = self.proposals();
		if (proposals.length == 0)
		{
		    return false;
		}
		for (var i = 0, j = proposals.length; i < j; i++)
		{
		    if (proposals[i].endorse_type() == 'notvoted')
		    {
		        return false;
		    }
		}
		return true;
    });

	self.getProposal = function(pid) // huh
    {
		var match = ko.utils.arrayFirst(self.proposals(), function (proposal)
        {
			return proposal.id() === parseInt(pid);
        });
        if (!match)
            return false;
        else
            return match;
    };

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
	    self.read(index, 'content', proposal);
	}

	self.readproposal = function(id)
	{
	    console.log("ProposalsViewModel.readproposal called with id " + id);
	    index = self.fetchIndex(id);
	}

	self.openvotemap = function(proposal) // ProposalsViewModel
	{
		console.log("ProposalsViewModel.openvotemap called for proposal " + proposal.id());
		voteMapViewModel.proposal = proposal; // booms
		//voteMapViewModel.proposal_index(index);
		voteMapViewModel.proposal_id(proposal.id());
		voteMapViewModel.endorse_type(proposal.endorse_type());
		$('#votemap-thisprop').html(proposal.title());
		$('#votemapwindow').modal('show');
	}
	
	// maison
	self.delete = function(index, proposal)
	{
		console.log("ProposalsViewModel.delete called with index " + index);
		var delete_proposal = confirm('Are you sure you want to delete this proposal?');
		if (!delete_proposal) return;
		
		var DELETE_URL = VILFREDO_API + '/questions/' + question_id + '/proposals/' + proposal.id();
	    console.log('delete propoal called...');
	    ajaxRequest(DELETE_URL, 'DELETE').done(function(data) {
		    console.log(data);
		    self.proposals.remove(proposal);
		    add_page_alert('success', 'Proposal "' + proposal.title() + '" deleted.');
		    questionViewModel.fetchQuestion();
		    questionViewModel.fetchParticipationTable();
		}).fail(function(jqXHR, textStatus, errorThrown)
		{
			console.log('delete: There was an error deleting the proposal. Status: ' + textStatus); // maison
            var message = getJQXHRMessage(jqXHR, 'There was a problem deleting your proposal');
            add_page_alert('danger', message);
        });
	}
	
	// maison
	self.edit = function(index, proposal)
	{
		//console.log("ProposalsViewModel.edit called with index " + index);
		editProposalViewModel().setProposal(proposal);
		editProposalViewModel().index = index;
		editProposalViewModel().show();
	}

	self.read = function(index, panel, proposal)
	{
		//console.log("ProposalsViewModel.read called with index " + index);
		viewProposalViewModel.setProposal(proposal);
		viewProposalViewModel.index = index;
		viewProposalViewModel.panel = panel;
		viewProposalViewModel.loadTriangle();
		viewProposalViewModel.reset();
		$('#viewproposal').modal('show');
	}
	
	self.addImageProposal = function(formdata) // bang
	{
        console.log("addImageProposal called...");
        var formdata = new FormData($('#newpropform')[0]);
        var URI = VILFREDO_API + '/questions/' + question_id + '/upload_image_proposal'; 
        var request = {
		    url: URI,
            type: 'POST',
            contentType: false,
            processData: false,
            async: false,
            cache: false,
            data: formdata,
            xhr: function() 
            { 
                myXhr = $.ajaxSettings.xhr();
                // check if upload property exists
                if(myXhr.upload){ 
                    // for handling the progress of the upload
                    myXhr.upload.addEventListener('progress', updateProgress, false);
                }
                return myXhr;
            },
            beforeSend: function (xhr) {
    			if (self.authToken != '')
    			{
    				xhr.setRequestHeader('Authorization',
    					"Basic " + btoa(currentUserViewModel.authToken + ":" + ''));
    			}
    			else if (self.username() != '' && currentUserViewModel.password != '')
    			{
    				xhr.setRequestHeader("Authorization",
                    	"Basic " + btoa(self.username() + ":" + self.password));
    			}
            },
            error: function(jqXHR) {
                console.log("ajax error " + jqXHR.status);
            }
        };
        
        $.ajax(request).done(function(data, textStatus, jqXHR) {
			var mapx = parseFloat(data.proposal.mapx);
		  		var mapy = parseFloat(data.proposal.mapy);
		  		var background = setMapColor(mapx, mapy);
		  		var color = getContrastYIQ(background);

	  		    self.proposals.push({
					id: ko.observable(parseInt(data.proposal.id)),
					title: ko.observable(data.proposal.title),
		      		blurb: ko.observable(data.proposal.blurb),
		      		abstract: ko.observable(data.proposal.abstract),
		      		author: ko.observable(data.proposal.author),
					endorse_type: ko.observable(data.proposal.endorse_type),
					uri: ko.observable(data.proposal.uri),
					author_id: ko.observable(parseInt(data.proposal.author_id)),
					image_url: ko.observable(data.proposal.image_url),
					question_count: ko.observable(parseInt(data.proposal.question_count)),
					comment_count: ko.observable(parseInt(data.proposal.comment_count)),
					vote_count: ko.observable(parseInt(data.proposal.vote_count)),
					generation_created: ko.observable(data.proposal.generation_created),
					mapx: ko.observable(mapx),
					mapy: ko.observable(mapy),
					box_background: ko.observable(background),
					box_color: ko.observable(color)
		  		});
		  		addProposalViewModel().close();
		  		questionViewModel.fetchQuestion();
		  		questionViewModel.fetchParticipationTable();
		  		
		  		/*
		  		var scale_timer;
		        clearTimeout(scale_timer);
		        scale_timer = setTimeout(function() 
				{
					scaleProposalImages();
		        }, 500);*/
		  		
			
		}).fail(function(jqXHR) {
           var message = getJQXHRMessage(jqXHR, 'There was a problem uploading your file.'); // stuffit
            $('#addproposal .alert')
            .text(message)
            .setAlertClass('danger')
            .fadeIn();
        });
    }


	self.add = function(proposal)
	{
		var URI = VILFREDO_API + '/questions/'+ question_id +'/proposals';
		return ajaxRequest(URI, 'POST', proposal).done(function(data, textStatus, jqXHR) {
		    console.log('Proposals data returned...');
			console.log(data);
			console.log('textstatus = ' + textStatus);
			console.log('status code = ' + jqXHR.statusCode());

			if (jqXHR.status == 201)
			{
	  		    var mapx = parseFloat(data.proposal.mapx);
		  		var mapy = parseFloat(data.proposal.mapy);
		  		var background = setMapColor(mapx, mapy);
		  		var color = getContrastYIQ(background);

	  		    self.proposals.push({
					id: ko.observable(parseInt(data.proposal.id)),
					title: ko.observable(data.proposal.title),
		      		blurb: ko.observable(data.proposal.blurb),
		      		abstract: ko.observable(data.proposal.abstract),
		      		author: ko.observable(data.proposal.author),
					endorse_type: ko.observable(data.proposal.endorse_type),
					uri: ko.observable(data.proposal.uri),
					author_id: ko.observable(parseInt(data.proposal.author_id)),
					question_count: ko.observable(parseInt(data.proposal.question_count)),
					comment_count: ko.observable(parseInt(data.proposal.comment_count)),
					vote_count: ko.observable(parseInt(data.proposal.vote_count)),
					generation_created: ko.observable(parseInt(data.proposal.generation_created)),
					mapx: ko.observable(mapx),
					mapy: ko.observable(mapy),
					box_background: ko.observable(background),
					image_url: ko.observable(data.proposal.image_url),
					box_color: ko.observable(color)
		  		});
		  		addProposalViewModel().close();
		  		questionViewModel.fetchQuestion();
		  		questionViewModel.fetchParticipationTable();
	  		}
	  		else
			{
				console.log(jqXHR.status);
				var message = getJQXHRMessage(jqXHR, 'There was an problem adding your proposal');
                $('#addproposal .alert')
                .text(message)
                .setAlertClass('danger')
                .fadeIn();
			}
		}).fail(function(jqXHR, textStatus, errorThrown) { // fix
            console.log('add: There was an error adding a proposal. Error ' + jqXHR.status);
            var message = getJQXHRMessage(jqXHR, 'There was an problem adding your proposal');
            $('#addproposal .alert')
            .text(message)
            .setAlertClass('danger')
            .fadeIn();
        }).always(function(jqXHR, textStatus, errorThrown) {
            addProposalViewModel().add_proposal_jqXHR = null;
        });
	}

	// Add vote using normalised votemap coordinates
	self.resultsmapEndorseProposal = function(mapx, mapy, pid) // lanister
	{
		if (currentUserViewModel.isLoggedIn() == false)
		{
		    console.log("Not logged in");
		    return;
		}

		var proposal = this.getProposal(pid);
		
		console.log('resultsmapEndorseProposal called with pid ' + pid + ' and coords ' + mapx + ', ' + mapy + " **************");
		var endorse_uri = VILFREDO_API + '/questions/'+ question_id +'/proposals/'+ pid +'/endorsements';
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
				
				/*
				if ( (prev_endorsement_type == 'endorse'
					&& (data.endorsement_type == 'confused' || data.endorsement_type == 'oppose'))
				|| (data.endorsement_type == 'endorse'
					&& (prev_endorsement_type == 'confused' || prev_endorsement_type == 'oppose'
					    || prev_endorsement_type == 'notvoted')) 
				|| ($('#voting_graphs').is(":visible") == false && proposalsViewModel.votedAll()) )
				*/
				
				if (proposalsViewModel.votedAll())
				{
				    console.log('Refreshing graphs after voted FOR ALL...');
					fetchVotingGraphs(); // boots
				}
				else
				{
				    console.log('Dont refresh graphs until voted FOR ALL...');
				}

				// Update vote coordinates and endorsement type
				proposal.endorse_type(data.endorsement_type);
				proposal.mapx(mapx);
				proposal.mapy(mapy);
				proposal.vote_count(parseInt(data.vote_count));
				
				proposal.box_background(setMapColor(mapx, mapy));
		  		proposal.box_color(getContrastYIQ(proposal.box_background()));

				// Draw vote on votemap if displayed
				redoResultsMap(); // haha
				questionViewModel.fetchQuestion();
				proposalsViewModel.proposals.sort(sortProposalsByLike);
			}
			else
			{
				console.log(jqXHR.status);
			}
		});
	}

	// Add vote using normalised votemap coordinates
	self.mapEndorseWithIndex = function(mapx, mapy, proposal) // strike
	{
		if (currentUserViewModel.isLoggedIn() == false)
		{
		    console.log("Not logged in");
		    return;
		}
		
		var dfd = $.Deferred();
		
		mapx = parseFloat(mapx);
		mapy = parseFloat(mapy);
		
		console.log('mapEndorseWithIndex called for proposal ' + proposal.id() + ' and coords ' + mapx + ', ' + mapy + " **************");
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
				
				/*
				if ( (prev_endorsement_type == 'endorse'
					&& (data.endorsement_type == 'confused' || data.endorsement_type == 'oppose'))
				|| (data.endorsement_type == 'endorse'
					&& (prev_endorsement_type == 'confused' || prev_endorsement_type == 'oppose'
					    || prev_endorsement_type == 'notvoted')) 
				|| ($('#voting_graphs').is(":visible") == false && proposalsViewModel.votedAll()) )
				{*/
					
				if (proposalsViewModel.votedAll())
				{
				    console.log('Refreshing graphs after voted FOR ALL...');
					fetchVotingGraphs(); // boots
				}
				else
				{
				    console.log('Dont refresh graphs until voted FOR ALL...');
				}
					
				// Update vote coordinates and endorsement type
				proposal.endorse_type(data.endorsement_type);
				proposal.mapx(mapx);
				proposal.mapy(mapy);
				proposal.vote_count(parseInt(data.vote_count));
				
				proposal.box_background(setMapColor(mapx, mapy));
		  		proposal.box_color(getContrastYIQ(proposal.box_background()));
		  						
				// setcolor
				//setProposalPanelColor(proposal);
				/*
				var background = setMapColor(proposal.mapx, proposal.mapy);
                var color = getContrastYIQ(background);
                $(".proposal_list .proposal[pid='" + proposal.id() + "'] .panel-heading").css("color", color).css("background-color", background).css("border", background);
                */

				// Draw vote on votemap if displayed
				if (questionViewModel.voting_type() == 1)
				{
				    setVote(proposal, dfd);
				}
				else
				{
    				setVoteLinear(proposal, dfd);
    			}	
				/*
				var svg = $('#modalvotesmap').svg('get');
				if (svg)
				{
				    setVote(svg, proposal);
				}
				*/
				// reset key players
				//self.fetchKeyPlayers();
				// reset participation table
				//questionViewModel.fetchParticipationTable();
				
				if (proposalsViewModel.votedAll())
				{
				    redoResultsMap();
				}
				
				questionViewModel.fetchQuestion();
				
				$('.voting').each(function(){
					var index = $(this).parents('.panel').siblings('.index')[0].value;
					var pid = $(this).parents('.panel').siblings('.propId')[0].value;
					//console.log('adding pid ' + pid + ' and threeway class to voting container...');
					$(this).data('pid', pid).addClass('threeway').data('index', index);
					//console.log('check if pid added ==> ' + $(this).data('pid'));
					console.log('Load triangle into proposal box');
					//$(this).svg({loadURL: flask_util.url_for('static', {filename:'images/triangle.svg'}),
					$(this).svg({loadURL: STATIC_FILES + getVoteMapIconPath()});//,
					//			 onLoad: init3WayTriangle});
				});
				
				proposalsViewModel.proposals.sort(sortProposalsByLike);
			}
			else
			{
				console.log(jqXHR.status);
			}
		});
		
		return dfd.promise();
	}

	self.show3WayTriangle = function()
	{
		console.log('show3WayTriangle called...');
		$('#vote3waywindow').modal('show');
		$('#vote3waywindow .show3waytriangle').svg(
		    {loadURL: flask_util.url_for('static', {filename:'images/triangle.svg'})}); //,
		//	onLoad: init3WayTriangle});
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
	
	self.fetchPareto = function() { // final
	    console.log('fetchWinningProposals() called...');
		//var proposalsURI = VILFREDO_API + '/questions/'+ question_id +'/proposals';
		//proposalsURI = proposalsURI + '?pareto_only=true';
		var URI = VILFREDO_API + '/questions/'+ question_id +'/pareto';

		return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('Proposals data returned...');
			console.log(data);
			self.pareto([]);
			fetched_proposals = [];
			for (var i = 0; i < data.proposals.length; i++) {
		  		
		  		var mapx = parseFloat(data.proposals[i].mapx);
		  		var mapy = parseFloat(data.proposals[i].mapy);
		  		var background = setMapColor(mapx, mapy);
		  		var color = getContrastYIQ(background);
		  		
		  		fetched_proposals.push({
		      		id: ko.observable(parseInt(data.proposals[i].id)),
					title: ko.observable(data.proposals[i].title),
		      		blurb: ko.observable(data.proposals[i].blurb),
		      		abstract: ko.observable(data.proposals[i].abstract),
		      		author: ko.observable(data.proposals[i].author),
					endorse_type: ko.observable(data.proposals[i].endorse_type),
					uri: ko.observable(data.proposals[i].uri),
					author_id: ko.observable(parseInt(data.proposals[i].author_id)),
					question_count: ko.observable(parseInt(data.proposals[i].question_count)),
					comment_count: ko.observable(parseInt(data.proposals[i].comment_count)),
					vote_count: ko.observable(parseInt(data.proposals[i].vote_count)),
					mapx: ko.observable(mapx),
					mapy: ko.observable(mapy),
					box_background: ko.observable(background), 
					box_color: ko.observable(color)
		  		});
			}
			self.pareto(fetched_proposals);
		});
	}

	self.fetchInheritedProposals = function() { // storm
	    console.log('fetchInheritedProposals() called...');
		var proposalsURI = VILFREDO_API + '/questions/'+ question_id +'/proposals';
		proposalsURI = proposalsURI + '?inherited_only=true';

		return ajaxRequest(proposalsURI, 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('Proposals data returned...');
			console.log(data);
			// Clear inherited_proposals list
+           self.inherited_proposals([]);
			
			fetched_proposals = [];
			for (var i = 0; i < data.proposals.length; i++) {
		  		
		  		var mapx = parseFloat(data.proposals[i].mapx);
		  		var mapy = parseFloat(data.proposals[i].mapy);
		  		var background = setMapColor(mapx, mapy);
		  		var color = getContrastYIQ(background);
		  		
		  		fetched_proposals.push({
		      		id: ko.observable(parseInt(data.proposals[i].id)),
					title: ko.observable(data.proposals[i].title),
		      		blurb: ko.observable(data.proposals[i].blurb),
		      		abstract: ko.observable(data.proposals[i].abstract),
		      		author: ko.observable(data.proposals[i].author),
					endorse_type: ko.observable(data.proposals[i].endorse_type),
					uri: ko.observable(data.proposals[i].uri),
					author_id: ko.observable(parseInt(data.proposals[i].author_id)),
					question_count: ko.observable(parseInt(data.proposals[i].question_count)),
					generation_created: ko.observable(data.proposals[i].generation_created),
					comment_count: ko.observable(parseInt(data.proposals[i].comment_count)),
					vote_count: ko.observable(parseInt(data.proposals[i].vote_count)),
					image_url: ko.observable(data.proposals[i].image_url),
					mapx: ko.observable(mapx),
					mapy: ko.observable(mapy),
					box_background: ko.observable(background), 
					box_color: ko.observable(color)
		  		});
			}
			self.inherited_proposals(fetched_proposals);
		});
	}


	self.fetchProposals = function(options) {
	    console.log('fetchProposals() called...');
	    self.clearData();
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
		return ajaxRequest(proposalsURI, 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('Proposals data returned...');
			console.log(data);
			self.proposals([]);
			var fetched_proposals = [];
			for (var i = 0; i < data.proposals.length; i++) {
			    
			    var mapx = parseFloat(data.proposals[i].mapx); 
		  		var mapy = parseFloat(data.proposals[i].mapy);
		  		var background = setMapColor(mapx, mapy); // hellfire
		  		var color = getContrastYIQ(background);
			    
		  		fetched_proposals.push({
		      		id: ko.observable(parseInt(data.proposals[i].id)),
					title: ko.observable(data.proposals[i].title),
		      		blurb: ko.observable(data.proposals[i].blurb),
		      		abstract: ko.observable(data.proposals[i].abstract),
		      		image_url: ko.observable(data.proposals[i].image_url),
		      		author: ko.observable(data.proposals[i].author),
					endorse_type: ko.observable(data.proposals[i].endorse_type),
					uri: ko.observable(data.proposals[i].uri),
					author_id: ko.observable(parseInt(data.proposals[i].author_id)),
					question_count: ko.observable(parseInt(data.proposals[i].question_count)),
					comment_count: ko.observable(parseInt(data.proposals[i].comment_count)),
					vote_count: ko.observable(parseInt(data.proposals[i].vote_count)),
					generation_created: ko.observable(data.proposals[i].generation_created),
					mapx: ko.observable(mapx),
					mapy: ko.observable(mapy),
					box_background: ko.observable(background), 
					box_color: ko.observable(color)
		  		});
			}
			proposals_list(fetched_proposals);
			console.log("***** sort proposals by mapx *****");
			proposals_list.sort(sortProposalsByLike);

			if (questionViewModel.phase() == 'voting' && questionViewModel.can_vote)
			{
				$('.voting').each(function(){
					var index = $(this).parents('.panel').siblings('.index')[0].value;
					var pid = $(this).parents('.panel').siblings('.propId')[0].value;
					//console.log('adding pid ' + pid + ' and threeway class to voting container...');
					$(this).data('pid', pid).addClass('threeway').data('index', index);
					//console.log('check if pid added ==> ' + $(this).data('pid'));
					console.log('Load triangle into proposal box');
					//$(this).svg({loadURL: flask_util.url_for('static', {filename:'images/triangle.svg'}),
					$(this).svg({loadURL: STATIC_FILES + getVoteMapIconPath()});//,
					//			 onLoad: init3WayTriangle});
				});
				//self.fetchKeyPlayers();
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

/*
function init3WayTriangle(svg)
{
	console.log('init3WayTriangle function called');
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
}*/

function drawVotingTriangle_off(svg)
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


/*
var questionViewModel = function(data) {
    ko.mapping.fromJS(data, {}, this);

    this.nameLength = ko.computed(function() {
        return this.name().length;
    }, this);

    this.can_move_on = ko.computed(function() {
	    var currentdate = new Date();
	    var currentSeconds = currentdate.getSeconds();
	    console.log(this.minimum_time());
	    return true;
	};
}*/

function InviteUsersViewModel()
{
    var self = this;
    // Update subscribers after 50 microseconds
    self.users = ko.observableArray([]).extend({ rateLimit: 50 });
    self.user_emails = ko.observable();
    self.emails_sent = ko.observable('');
    self.emails_rejected = ko.observable('');
    self.emails_already_sent = ko.observable('');

    self.questionPermissions = ko.observable([
       {name: "Read", id: 1},
       {name: "Vote", id: 3},
	   {name: "Propose", id: 5},
	   {name: "Vote, Propose", id: 7}
    ]);

    self.questionEmailPermissions = ko.observable([
       {name: "Read", id: 1},
       {name: "Vote", id: 3},
	   {name: "Propose", id: 5},
	   {name: "Vote, Propose", id: 7}
    ]);

    self.selectedPermissions = 7;
    
    self.invite_by_email = function()
	{
	    console.log("invite_by_email called...");
        var URI = VILFREDO_API + '/questions/' + question_id + '/emailinvitations';
        var invite_users = {'user_emails': self.user_emails(), 'permissions': self.selectedPermissions};
		return ajaxRequest(URI, 'POST', invite_users).done(function(data, textStatus, jqXHR) {
		    console.log('Email invitations sent...');
		    // Remove the added users from the list of uninvited users
		    console.log(data.invites.rejected);
			self.emails_sent(data.invites.accepted);
			self.emails_rejected(data.invites.rejected);
			self.emails_already_sent(data.invites.already_sent);
			self.user_emails('');
		});
	}

    //
    // Fetch non-participating associated users
    //
    self.fetched_associated_users = function()
	{
		self.users([]);
		var URI = VILFREDO_API + '/users/associated_users?ignore_question=' + question_id;
		return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('Not invited list returned...');
		    var fetched_users = [];
			for (var i = 0; i < data.not_invited.length; i++) {
				fetched_users.push({
		      		user_id: data.not_invited[i].user_id,
					username: data.not_invited[i].username,
		      		selected: ko.observable(false)
		  		});
			}
			self.users(fetched_users);
		});
	}

    self.fetched_uninvited_associates = function()
	{
		self.users([]);
		var URI = VILFREDO_API + '/questions/' + question_id + '/not_invited';
		return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('Not invited list returned...');
		    var fetched_users = [];
			for (var i = 0; i < data.not_invited.length; i++) {
				fetched_users.push({
		      		user_id: data.not_invited[i].user_id,
					username: data.not_invited[i].username,
		      		selected: ko.observable(false)
		  		});
			}
			self.users(fetched_users);
		});
	}

	self.add_users = function()
	{
	    console.log("InviteUsersViewModel.add_users called...");
	    var invite_user_ids = new Array();
	    var invite_user = new Array();
	    ko.utils.arrayForEach(self.users(), function(user)
	    {
            if (user.selected())
            {
                invite_user_ids.push(user.user_id);
                invite_user.push(user.username);
            }
        });
        console.log('Selected Users = [' + invite_user_ids + ']');
        var URI = VILFREDO_API + '/questions/' + question_id + '/invitations';
        var invite_users = {'invite_user_ids': invite_user_ids, 'permissions': self.selectedPermissions};
		return ajaxRequest(URI, 'POST', invite_users).done(function(data, textStatus, jqXHR) {
		    console.log('Users added to list of participants...');
		    // Remove the added users from the list of uninvited users
			self.users.remove(function(user) { return user.selected(); });
			// Feedback
		});
	}
	self.open_add_users = function()
	{
	    console.log("open_add_users.open called...");
	    self.permissions(questionViewModel.permissions());
	    $('#participants').modal('show');
	}
	self.close_add_users = function()
	{
	    console.log("close_add_users called...");
	    self.user_emails('');
        self.emails_sent('');
        self.emails_rejected('');
        self.emails_already_sent('');
	    $('#add_users').modal('hide');
	    permissionsViewModel.fetchParticipantPermissions();
	    $('#participants').modal('show');
	}
}
function PermissionsViewModel() // wolf
{
    var self = this;
    self.permissions = ko.observableArray();
    self.invitations_sent = ko.observableArray();
    self.email_invitations_sent = ko.observableArray();

    self.questionPermissions = ko.observable([
       {name: "Read", id: 1},
       {name: "Vote", id: 3},
	   {name: "Propose", id: 5},
	   {name: "Vote, Propose", id: 7}
    ]);

    self.selectedPermissions = 7;

    self.userPerms = function (user, perm) {
        return ko.computed({
            read: function () {
                return !!(user.permissions & perm);
            },
            write: function (checked) {
                if (checked)
                    user.permissions = user.permissions | perm;
                else
                    user.permissions = user.permissions & ~perm;
            }
        }, user);
    };

	self.fetchParticipantPermissions = function()
	{   
		self.permissions([]);
		var URI = VILFREDO_API + '/questions/' + question_id + '/permissions';
		return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('Question permissions returned...');
			//self.permissions(data.permissions);
			var fetched_permissions = [];
			for (var i = 0; i < data.permissions.length; i++) 
			{
				fetched_permissions.push({
		      		user_id: data.permissions[i].user_id,
					username: data.permissions[i].username,
					permissions: parseInt(data.permissions[i].permissions)
		  		});
			}
			self.permissions(fetched_permissions);
			
			// Update question particpant_count
			if (fetched_permissions.length > questionViewModel.participant_count())
			{
			    console.log('New partiipants added. Updating question and participation table');
			    //questionViewModel.participant_count(fetched_permissions.length);
			    questionViewModel.fetchQuestion();
			    questionViewModel.fetchParticipationTable();
			}
			
			self.invitations_sent();
			var fetched_invites = [];
			for (var i = 0; i < data.invitations_sent.length; i++) 
			{
		  		fetched_invites.push({
		  		    id: data.invitations_sent[i].id,
					permissions: data.invitations_sent[i].permissions,
					username: data.invitations_sent[i].username
		  		});
			}
			self.invitations_sent(fetched_invites);
			
			self.email_invitations_sent();
			var fetched_invites = [];
			for (var i = 0; i < data.email_invitations_sent.length; i++) 
			{
		  		fetched_invites.push({
					permissions: data.email_invitations_sent[i].permissions,
					email: data.email_invitations_sent[i].email
		  		});
			}
			self.email_invitations_sent(fetched_invites);
		});
	}
	self.open_permissions = function()
	{
	    console.log("open_permissions.open called...");
	    //self.permissions(questionViewModel.permissions());
	    self.fetchParticipantPermissions();
	    $('#participants').modal('show');
	}

	self.add_users = function()
	{
	    console.log("PermissionsViewModel.add_users called...");
	    inviteUsersViewModel.fetched_associated_users();
	    $('#participants').modal('hide');
	    $('#add_users').modal('show');
	}
	self.update_permissions = function()
	{
	    console.log("update_permissions called...");
	    questionViewModel.updatePermissions(self.permissions);
	}
	self.close_permissions = function()
	{
	    console.log("close_permissions called...");
	    $('#participants').modal('hide');
	}
	self.reset_permissions = function()
	{
	    console.log("reset_permissions called...");
	    self.permissions(questionViewModel.permissions());
	}
	self.remove_permissions = function()
	{
	    // remove permissions for user - in other words exclude him completely from the question
	    console.log("remove_permissions called for user " + this.user_id);
	    self.permissions.remove(this);
	}
}

function QuestionViewModel() // bang
{
	var self = this;
	self.URI = VILFREDO_API + '/questions/' + question_id;
	self.id = ko.observable();
	self.title = ko.observable();
	self.blurb = ko.observable();
	self.author = ko.observable();
	self.author_id = ko.observable();
	self.avatar_url = ko.observable();
	self.phase = ko.observable();
	self.question_type = ko.observable();
	self.generation = ko.observable();
	self.last_move_on = ko.observable();
	self.minimum_time = ko.observable();
	self.maximum_time = ko.observable();
	self.mapx = ko.observable();
	self.mapy = ko.observable();
	self.proposal_count = ko.observable();
	self.created;
	self.proposal_relations;
	self.can_vote = false;
	self.can_propose = false;
	self.can_propose_ob = ko.observable(false);
	self.can_not_propose = false;
	self.completed_voter_count = ko.observable();
	self.finished_writing_count = ko.observable();
	self.new_proposal_count = ko.observable();
    self.new_proposer_count = ko.observable();
    self.participant_count = ko.observable();
    self.voters_voting_count = ko.observable();
    self.consensus_found = ko.observable();
    self.inherited_proposal_count = ko.observable();
    self.voting_type = ko.observable();
    self.my_permissions = ko.observable();
    
    self.finished_writing = ko.observable(0);
    self.show_finished_writing = ko.computed(function() {
        if (self.finished_writing() == 0)
        {
		    return 'I have no more Proposals';
		}
		else
		{
		    return 'Resume Proposing';
		} 
    }, this);

	self.key_players = ko.observableArray();

	self.participation_table = ko.observable();
	self.num_proposals = ko.observable();
	
	self.edit = function()
	{
		console.log("QuestionViewModel.edit called...");
		
		//editQuestionViewModel().setQuestion(self);
		//editQuestionViewModel().show();
		
		amplify.store( "editquestion", { blurb: self.blurb(), title: self.title(), id: self.id(),
		                                question_type: self.question_type(), voting_type: self.voting_type(),
		                                permissions: self.my_permissions()} );
		window.location.replace(VILFREDO_URL+"/editquestion");
	}

    self.show_finished_writing_in_table = function(finished) {
        if (finished == 0)
        {
		    return 'Still Writing';
		}
		else
		{
		    return 'Finished';
		} 
    }

	self.domination_map_array = ko.observableArray([]);
	//self.domination_map = ko.observable();
	self.levels_map = ko.observable();
	self.voting_map = ko.observable();


    self.dom_table_algorithm = ko.observable(ALGORITHM_VERSION);
	self.levels_table_algorithm = ko.observable(ALGORITHM_VERSION);

	self.selected_generation = ko.observable(generation_id);
	self.selected_algorithm = ko.observable(ALGORITHM_VERSION);

	self.permissions = ko.observable([]);

	self.voting_data = null; // final
	self.final_results = ko.observableArray([]);
	
	
	self.results_pf_only = ko.observable(false); // lava

	self.questionPermissions = ko.observableArray([
       {name: "Read", id: 1},
       {name: "Vote", id: 3},
	   {name: "Propose", id: 5},
	   {name: "Vote, Propose", id: 7}
    ]);
    
    self.set_finished_writing = function()
    {
        console.log("finished_writing called...");
        //var finish = confirm('Are you sure you wish to finish writing for this geenration?');
		//if (!finish) return;
		var method = (self.finished_writing() == 0) ? 'POST': 'DELETE';
		console.log('set_finished_writing method = ' + method);
		var url = VILFREDO_API + '/questions/' + question_id + '/finished_writing';
		ajaxRequest(url, method).done(function(data) {
		    console.log("finished_writing: status updatd]");
		    self.finished_writing(data.writing_status);
		    self.fetchParticipationTable();
		}).fail(function(jqXHR, textStatus, errorThrown)
		{
            var message = getJQXHRMessage(jqXHR, 'There was a problem updating your writing status');
            add_page_alert('danger', message);
        });
    }
    
    self.set_question_status = function()
	{
	    var html = '';
	    if (self.phase() == 'writing')
	    {
    	    if (self.new_proposal_count() > 0)
    	    {
    	        html = html + self.new_proposer_count() + ' out of ' + self.participant_count()
    	            + ' participants submitted ' + self.new_proposal_count() + ' proposals';
    	    }
    	    else
    	    {
    	        html = html + "No new proposals so far.";
    	    }
    	    if (self.inherited_proposal_count() > 0)
    	    {
    		    var total_props = self.new_proposal_count() + self.inherited_proposal_count();
    	        html = html + "<br>There are also "
    		        + self.inherited_proposal_count()
    		        + " inherited from the previous generation, so " +  total_props + " in total";
    	    }
	    }
	    else if (self.phase() == 'voting')
	    {
	        var not_finished = self.voters_voting_count() - self.completed_voter_count();
	        var html;
	        
	        if (self.voters_voting_count() == 0)
    	    {
    	        html = "No one started voting. Be the first!";
    	    }
    	    else
    	    {
	            html = "Out of " + self.participant_count() + ' participants ';
        	    if (not_finished && self.completed_voter_count())
        	    {
        	        html = html + ", " + self.completed_voter_count() + " finished voting, " +  not_finished +  " started voting";
        	    }
        	    else if (self.completed_voter_count())
        	    {
        	        html = html + ", " + self.completed_voter_count() + " finished voting";
        	    }
        	     else if (not_finished)
        	    {
        	        html = html + ", " +  not_finished +  " started voting";
        	    }
        	}
	    }
	    else if (self.phase() == 'results')
	    {
    	    html = html + self.completed_voter_count() + ' out of ' + self.participant_count()
    	            + ' participants contributed';
        }
        return html;
	}
    
    // storm
    self.fetchQuestion = function() 
	{
	    console.log('fetchQuestion called...');
	    var URL = VILFREDO_API + '/questions/' + question_id;

	    return ajaxRequest(URL, 'GET').done(function(data) {
		    console.log('Question data returned...');
			console.log(data);
			self.id(data.question.id);
			self.title(data.question.title);
    		self.blurb(data.question.blurb);
    		self.author(data.question.author);
    		self.author_id(data.question.author_id);
    		self.avatar_url(data.question.avatar_url);
    		self.phase(data.question.phase);
    		self.question_type(data.question.question_type);
    		self.voting_type(data.question.voting_type);
    		self.last_move_on(parseInt(data.question.last_move_on));
    		self.minimum_time(parseInt(data.question.minimum_time));
    		self.maximum_time(parseInt(data.question.maximum_time));
    		self.generation(parseInt(data.question.generation));
    		self.created = parseInt(data.question.created);
    		self.mapx = parseFloat(data.question.mapx);
    		self.mapy = parseFloat(data.question.mapy);
    		self.can_vote = data.question.can_vote;
    		self.can_propose = data.question.can_propose;
    		self.my_permissions(data.question.my_permissions);
    		self.can_propose_ob(data.question.can_propose);
    		// User permissions will be set if user is question author
    		self.permissions(data.question.user_permissions);
    		self.proposal_count(parseInt(data.question.proposal_count));
    		self.participant_count(parseInt(data.question.participant_count));
    		self.voters_voting_count(parseInt(data.question.voters_voting_count));
    		self.completed_voter_count(parseInt(data.question.completed_voter_count));
    		self.finished_writing_count(data.question.finished_writing_count);
    		self.new_proposal_count(parseInt(data.question.new_proposal_count));
    		self.new_proposer_count(parseInt(data.question.new_proposer_count));
    		self.consensus_found(data.question.consensus_found);
    		self.inherited_proposal_count(parseInt(data.question.inherited_proposal_count));
    		self.finished_writing(data.question.finished_writing);
	    }).fail(function(jqXHR, textStatus, errorThrown)
		{
            var message = getJQXHRMessage(jqXHR, 'There was an problem with your request');
            $.cookie('vgamessage', message, { path: '/' });
			$.cookie('vgastatus', 'error', { path: '/' });
			window.location.replace(VILFREDO_URL);
        });

	    //
  		// Set selected generation to current generation if not already set
  		//
  		if (typeof(generation_id == 'undefined'))
  		{
  		    generation_id = parseInt(data.question.generation);
  		}
    }

    
    // chat
	self.delete = function()
	{
		console.log("QuestionViewModel.delete called...");
		var delete_question = confirm('Are you sure you want to delete this question?');
		if (!delete_question) return;
		
		var DELETE_URL = VILFREDO_API + '/questions/' + self.id();
	    console.log('delete question called...');
	    ajaxRequest(DELETE_URL, 'DELETE').done(function(data) {
		    console.log("Question deleted!");
		    window.location.replace(VILFREDO_URL);
		}).fail(function(jqXHR, textStatus, errorThrown)
		{
			console.log('deleteproposal: There was an error editing the proposal. Status: ' + textStatus); // maison
            var message = getJQXHRMessage(jqXHR, 'There was a problem updating your proposal');
            add_page_alert('danger', message);
        });
	}
    
    self.select_pf_only = function(pf_only, $data) // bang
    {
        self.results_pf_only(pf_only);
        //redoResultsMap();
        if (pf_only)
        {
            var svg = $('#resultstriangle').svg('get');
            $('#resultstriangle #allvotes, #resultstriangle #alluservotes').remove();
            $('.med, .medlabel', svg.root()).filter(function() {
            	return $(this).hasClass("pareto") == false;
            }).remove();   
            var triangle = $('#results_triangle');
		    if (triangle.length == 1) 
		    {
		    	triangle.data('settings', {'mode': 'default'});
		    }         
        }
        else
        {
            redoResultsMap();
        }
    }
    
    self.is_author = function()
    {
        return self.author_id() == currentUserViewModel.userid();
    }
    
    self.show_pareto_results = ko.computed(function() {
        if (self.results_pf_only())
        {
		    return 'Winners Only';
		}
		else
		{
		    return 'All Proposals';
		} 
    }, this);

    self.defaultPermissions = 7;

	self.permissionTitles = function(val)
	{
	    switch(parseInt(val))
        {
        case 1:
            return 'Read';
            break;
        case 3:
            return 'Vote';
            break;
        case 5:
            return 'Propose';
            break;
        case 7:
            return 'Propose, Vote';
            break;
        default:
            return '-';
        }
	}

	// shark
	self.updatePermissions = function()
	{
	    console.log("updatePermissions called...");
	}
	self.closePermissions = function()
	{
	    console.log("closePermissions called...");
	    $('#participants').modal('hide');
	}
	self.resetPermissions = function()
	{
	    console.log("resetPermissions called...");
	}
	self.removePermissions = function()
	{
	    // remove permissions for user
	    console.log("Remove permisions for user " + this.user_id);
	    self.permissions.remove(this);
	}

	// final
	self.fetchVotingData = function() {
		var URI = VILFREDO_API + '/questions/' + question_id + '/voting_data';
		return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('Question voting data returned...');
			self.voting_data = data.voting_data;
			//updateResultsMap();
		});
	}

	self.fetchParticipationTable = function() {
		var URI = VILFREDO_API + '/questions/' + question_id + '/participation_table';
		return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('participation table data returned...');
			self.participation_table(data.participation_table);
			self.num_proposals(data.num_proposals)
		});
	}
	//
    // Participation Table colors and text
    //
    self.proposalsEvaluatedClass = function(evaluations) {
        if (self.phase() == 'voting')
        {
            if (evaluations == 0) return 'red';
            else if (evaluations == self.num_proposals()) return 'green';
            else return 'amber';
        }
        else
        {
            return 'grey';
        }
    }
    self.keyPlayerClass = function(key_player) {
        if (key_player) return 'red';
        else return 'green';
    }
    self.generationsParticipatedClass = function(generations) {
        if (generations == self.generation()) return 'amber';
        else if (generations == 0) return 'green';
        else return '';
    }
	self.proposalsEvaluatedText = function(evaluations) {
        return evaluations + '/' + self.num_proposals();
    }


	self.hasConfusedVotes = function(generation_id) {
	    if (typeof(self.voting_map()) == 'undefined') return;
	    return self.voting_map()[generation_id]['confused_count'] + self.voting_map()[generation_id]['oppose_count'];
    }

    self.alternateVotes = function(generation_id) {
	    if (typeof(self.voting_map()) == 'undefined' || typeof(generation_id)  == 'undefined') return;
	    return 'Generation ' + generation_id + ' has ' + self.voting_map()[generation_id]['confused_count'] + ' confused and ' + self.voting_map()[generation_id]['oppose_count'] + ' opposed votes';
    }

    self.proposalVoting = function(pid) {
	    if (
	        typeof(self.voting_map()) == 'undefined' ||
	        typeof(self.selected_generation()) == 'undefined' ||
	        typeof(pid) == 'undefined' ||
	        typeof(self.voting_map()[self.selected_generation()]['proposals'][pid]) == 'undefined' ||
	        typeof(self.voting_map()[self.selected_generation()]['proposals'][pid].votes) == 'undefined' )
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

    self.fetchTablesForSelectedAlgorithm = function(algorithm) {
        // Set the current generation for tables
        self.selected_algorithm(algorithm);

        // Fetch graph
        fetchGenerationGraph(self.selected_generation(), self.selected_algorithm())

        self.domination_map_array([]);
        self.fetchDominationMap(self.selected_algorithm());
		self.fetchLevelsMap(self.selected_algorithm());
    }

    self.fetchTablesForSelectedGeneration = function(generation_id) {
        // Set the current generation for tables
        self.selected_generation(generation_id);

        // Fetch graph
        fetchGenerationGraph(self.selected_generation(), self.selected_algorithm())

        self.domination_map_array([]);
        self.fetchDominationMap(self.selected_algorithm());
		self.fetchLevelsMap(self.selected_algorithm());
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
    
    // final
    self.fetchFinalResults = function()
    {
        var URI = VILFREDO_API + '/questions/' + question_id + '/results';
        return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) {
		    console.log('Final results returned!...');
		    console.log(data.message);
		    results = data.results
		    self.final_results(data.results.sort(SortByMedx));
		}).fail(function(jqXHR)
    	{
    		console.log('fetch_final_results: There was an error fetching the final results. Error ' + jqXHR.status);
        });
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
		    var fetched_domination_map = [];
			//self.domination_map(data.domination_map);
			for (var i = 0; i < data.domination_map.length; i++) {
			    fetched_domination_map.push(data.domination_map[i]);
		    }
		    //alert(self.dom_table_algorithm());
		    self.domination_map_array(fetched_domination_map);
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

	self.can_move_on = ko.computed(function() {
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

	self.userPermissions = function() // shark
	{
	    alert('here');
	    permissionsViewModel.open();
	}
	
	// final
	self.show_results = function()
	{
	    console.log('show_results called...');
	    window.location.replace(VILFREDO_URL+"/question/"+ question_id +"/results");
	}
	
	// final
	self.move_to_results = function()
	{
	    console.log('moveToResults called...');
	    ajaxRequest(VILFREDO_API + '/questions/' + question_id, 'POST', {move_to_results:true}).done(function(data) {
		    questionViewModel.phase(data.phase);
		    add_page_alert('success', 'This question is now in ' + questionViewModel.phase() + ' phase');
		});
	}

	self.move_on = function()
	{
	    console.log('move_on called...');
	    ajaxRequest(VILFREDO_API + '/questions/' + question_id, 'POST', {move_on:true}).done(function(data) {
		    add_page_alert('success', 'Question now in ' + data.question.phase + ' phase');
		    console.log('Move on question data returned...');
			console.log(data);
			
    		self.phase(data.question.phase);
    		self.last_move_on(parseInt(data.question.last_move_on));
    		self.generation(data.question.generation);
    		
    		// storm
    		if (questionViewModel.phase() == 'writing')
		    {
		        //proposalsViewModel.fetchInheritedProposals();
		        //proposalsViewModel.fetchProposals({user_only: true});
		        
		        $.when(proposalsViewModel.fetchInheritedProposals(), 
		               questionViewModel.fetchQuestion(),
			    	   proposalsViewModel.fetchProposals({user_only: true})).done(function()
			    {
					fetchGraphs(questionViewModel.selected_algorithm()); // boots
					//scaleProposalImages();
				});
		        
		    }
		    else if (questionViewModel.phase() == 'voting')
		    {
		        console.log('fetchCurrentUser: Fetching all proposals');
		        proposalsViewModel.fetchProposals();
		        $.when(proposalsViewModel.fetchProposals()).done(function()
			    {
					//scaleProposalImages();
				});
		    }
    		/*
    		if (questionViewModel.phase() == 'voting' && questionViewModel.can_vote)
			{
				$('.voting').each(function(){
					var index = $(this).parents('.panel').siblings('.index')[0].value;
					var pid = $(this).parents('.panel').siblings('.propId')[0].value;
					$(this).data('pid', pid).addClass('threeway').data('index', index);
					console.log('Load triangle into proposal box');
					$(this).svg({loadURL: STATIC_FILES + '/images/triangle.svg'});
				});
				$('.votebox').svg({loadURL: STATIC_FILES + '/images/triangle.svg'});
			}*/
			
	    });
	}
}

function fetchGraph2(map_type, generation, algorithm)
{
	generation = generation !== undefined ? generation : questionViewModel.generation();
	map_type = map_type !== undefined ? map_type : DEFAULT_MAP_TYPE;
	algorithm = algorithm !== undefined ? algorithm : ALGORITHM_VERSION;

	var URI = VILFREDO_API + '/questions/'+ question_id +'/graph?generation=' + generation + '&map_type=' + map_type + '&algorithm=' + algorithm;

	return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) {
	    console.log('fetchGraph2 data returned...');
		console.log(data);
	});
}

function fetchGraph(map_type, generation, algorithm)
{
	generation = generation !== undefined ? generation : questionViewModel.generation();
	map_type = map_type !== undefined ? map_type : DEFAULT_MAP_TYPE;
	algorithm = algorithm !== undefined ? algorithm : ALGORITHM_VERSION;

	var URI = VILFREDO_API + '/questions/'+ question_id +'/graph?generation=' + generation + '&map_type=' + map_type + '&algorithm=' + algorithm;

	return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) {
	    console.log('fetchGraph data returned...');
		console.log(data);
	});
}

function fetchGraphs(algorithm, generation)
{
    console.log("fetchGraphs called...")
    generation = generation !== undefined ? generation : questionViewModel.generation();
    algorithm = algorithm !== undefined ? algorithm : ALGORITHM_VERSION;
    phase = questionViewModel.phase();
    if (phase == 'writing' && generation > 1 && generation == questionViewModel.generation())
    {
        fetchWritingGraph(generation, algorithm);
    }
    else if (phase == 'voting') // snow boots
    {
        console.log("fetchGraphs: fetchVotingGraphs called ************  " + proposalsViewModel.votedAll());
        console.log("fetchGraphs: fetchVotingGraphs called ************  num proposals = " + proposalsViewModel.proposals().length);
        fetchVotingGraphs(generation, algorithm);
    }
}

function fetchWritingGraph(generation, algorithm)
{
	console.log("fetchWritingGraphs called...")
	generation = generation !== undefined ? generation : questionViewModel.generation();
	algorithm = algorithm !== undefined ? algorithm : ALGORITHM_VERSION;
	$.when(fetchGraph('pareto', generation-1, algorithm)).done(function( graph_resp )
	{
		//if (typeof graph_resp[2].status !== 'undefined' && graph_resp[2].status == 204)
		if (false)
		{
		    $('#voting_graphs').hide();
		    console.log('fetchWritingGraphs: No endorsememnts yet');
		}
		else
		{
		    console.log("show 2");
		    $('#voting_graphs').show();
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

function fetchGenerationGraph(generation, algorithm) // jazz
{
	console.log("fetchGenerationGraph called...");
	console.log("Fetching GenerationGraph called with algorithm " + algorithm);
	generation = generation !== undefined ? generation : questionViewModel.generation();
	algorithm = algorithm !== undefined ? algorithm : ALGORITHM_VERSION;
	console.log("Fetching GenerationGraph for genration " + generation + ' using alg ' + algorithm);

    console.log("Fetching GenerationGraph for genration " + generation);
    //$.when(fetchGraph2('all', generation, algorithm)).done(function( all )
    $.when(fetchGraph('all', generation, algorithm)).done(function( all )
	{
	    console.log("show 3");
	    $('#voting_graphs').show();
	    // a1 and a2 are arguments resolved for the page1 and page2 ajax requests, respectively.
		// Each argument is an array with the following structure: [ data, statusText, jqXHR ]
		//console.log( "Generation graph URL = " + all[0]['url'] );
		gengraph = all['url'];
		console.log("Loading gengraph " + gengraph);
		loadSingleGraph(gengraph);
	}).fail(function(jqXHR)
	{
		console.log('fetchGenerationGraph: There was an error fetching the graph. Error ' + jqXHR.status);
    });
}

function fetchVotingGraph(generation, algorithm)
{
	console.log("fetchVotingGraph called...");
	generation = generation !== undefined ? generation : questionViewModel.generation();
	algorithm = algorithm !== undefined ? algorithm : ALGORITHM_VERSION;
	
	if (!proposalsViewModel.votedAll())
	{
	    console.log("Don't fetch graph until user has voted for all proposals - " + proposalsViewModel.votedAll());
	    return;
	}

	$.when(fetchGraph('all', generation, algorithm)).done(function( all )
	{
	    console.log("show 4");
	    $('#voting_graphs').show(); // boots
	    // a1 and a2 are arguments resolved for the page1 and page2 ajax requests, respectively.
		// Each argument is an array with the following structure: [ data, statusText, jqXHR ]
		votesgraph = all['url'];
		console.log("Loading votesgraph " + votesgraph);
		loadSingleGraph(votesgraph);
	}).fail(function(jqXHR)
	{
		console.log('fetchVotingGraph: There was an error fetching the graphs. Error ' + jqXHR.status);
    });
}
function fetchVotingGraphs(generation, algorithm) // boots
{
	console.log("fetchVotingGraphs called...");
	generation = generation !== undefined ? generation : questionViewModel.generation();
	algorithm = algorithm !== undefined ? algorithm : questionViewModel.selected_algorithm();

	if (algorithm > 1)
	{
	    return fetchVotingGraph(generation, algorithm);
	}

	$.when(fetchGraph('all', generation, algorithm), fetchGraph('pareto', generation, algorithm)).done(function( all, pareto )
	{
		if (all[2].status == 204)
		{
		    $('#voting_graphs').hide();
		    console.log('fetchVotingGraphs: No endorsememnts yet');
		}
		else
		{
		    console.log("show 1");
		    $('#voting_graphs').show();
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
		console.log('fetchVotingGraphs: There was an error fetching the graphs. Error ' + jqXHR.status);
    });
}

var ajaxRequestPR = function(uri, method, data) {
	console.log('ajaxRequest: request made... ' + uri);
	var request = {
		url: uri,
        type: method,
        contentType: "application/json",
        accepts: "application/json",
        cache: false,
        dataType: 'json',
        data: JSON.stringify(data),
        error: function(jqXHR) {
            console.log("ajax error " + jqXHR.status);
        }
     };
     return $.ajax(request);
}

var ajaxFormRequest = function(uri, formdata) {
	console.log('ajaxFormRequest: request made... ' + uri);
	console.log('ajaxFormRequest: formdata... ' + formdata);
    var request = {
		url: uri,
        type: 'POST',
        contentType: false,
        processData: false,
        async: false,
        cache: false,
        data: formdata,
        beforeSend: function (xhr) {
			if (currentUserViewModel.authToken != '')
			{
				//console.log("Use the auth token " + currentUserViewModel.authToken);
				xhr.setRequestHeader('Authorization',
					"Basic " + btoa(currentUserViewModel.authToken + ":" + ''));
			}
			else if (currentUserViewModel.username() != '' && currentUserViewModel.password != '')
			{
				//console.log("Use login details");
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

// jumpx
var ajaxRequest = function(uri, method, data) {
	console.log('ajaxRequest: request made... ' + uri);
	console.log('ajaxRequest: method... ' + method);
    var request = {
		url: uri,
        type: method,
        crossDomain: true,
        xhrFields: { withCredentials: true },
        contentType: "application/json",
        accepts: "application/json",
        cache: false,
        dataType: 'json',
        data: JSON.stringify(data),
        beforeSend: function (xhr) {
			if (currentUserViewModel.authToken != '')
			{
				//console.log("Use the auth token " + currentUserViewModel.authToken);
				xhr.setRequestHeader('Authorization',
					"Basic " + btoa(currentUserViewModel.authToken + ":" + ''));
			}
			else if (currentUserViewModel.username() != '' && currentUserViewModel.password != '')
			{
				//console.log("Use login details");
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

var enterShow = function() {
    console.log('enterShow')
	$(this).popover('show');
};

var exitHide = function() {
    $(this).popover('hide');
}
