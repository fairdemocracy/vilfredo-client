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

function setNode(node)
{
	//switch(node.data(''))
}

$(function()
{
	//loadGraph(votesgraph, pfvotesgraph);
	//loadTriangles();
	
	
	$('.button').mouseenter(function(event){
		$(this).addClass("over");
	});
	$(".button").mouseleave(function(event){
		$(this).removeClass("over");
	});

	$('#vgonly').click(function(event){	
		var votes = $('#votesgraph');
		var graphbox = $('.graphs');
		var pfgraph = $('#pfgraph');

		if (votes.is(":visible") && pfgraph.is(":visible"))
		{
			pfgraph.fadeOut(1000, function(){			
				votes.css("width", graphbox.innerWidth());
				setGraphSize(votes.svg("get")); 
			});
		}
		else if (!votes.is(":visible") && pfgraph.is(":visible")) //error
		{	
			pfgraph.css("width", "49%");
			setGraphSize(pfgraph.svg("get"));
			pfgraph.fadeOut(1000, function(){	
				votes.css("width", graphbox.innerWidth());
				setGraphSize(votes.svg("get")); 
				votes.fadeIn(1000);
			});	
		}
	});
	$('#pfonly').click(function(event){	
		var pfgraph = $('#pfgraph');
		var graphbox = $('.graphs');
		var votes = $('#votesgraph');

		if (votes.is(":visible") && pfgraph.is(":visible"))
		{
			votes.fadeOut(1000, function(){
				pfgraph.css("width", graphbox.innerWidth());
				setGraphSize(pfgraph.svg("get")); 
			});
		}
		else if (votes.is(":visible") && !pfgraph.is(":visible")) //error
		{	
			votes.css("width", "49%");
			setGraphSize(votes.svg("get"));
			votes.fadeOut(1000, function(){
				pfgraph.css("width", graphbox.innerWidth());
				setGraphSize(pfgraph.svg("get")); 
				pfgraph.fadeIn(1000);
			});	
		}
	});
	$('#bothgraphs').click(function(event){	
		var graphbox = $('.graphs');
		var votes = $('#votesgraph');
		var pfgraph = $('#pfgraph');

		if (votes.is(":visible") && !pfgraph.is(":visible"))
		{
			votes.css("width", "49%");
			setGraphSize(votes.svg("get"));
			pfgraph.fadeIn(1000);
		}
		else if (!votes.is(":visible") && pfgraph.is(":visible"))
		{
			pfgraph.css("width", "49%");
			setGraphSize(pfgraph.svg("get"));
			votes.fadeIn(1000);
		}
	});
});

// Triangles

function loadTriangles()
{
	console.log("loadTriangles called....");
	var $triangles = $('.voting');
	$triangles.svg({loadURL: 'static/images/triangle.svg', onLoad: initTriangle});
}

function initTriangle(svg) 
{
	console.log("initTriangle called....");
	//setTriangleSize(svg, '40px', '40px');
	//var triangle = $(this);
	return;
	triangle.on( "click", function() {
        alert( $( this ).attr('title'));
        //alert( $( this ).parents('.proposal').find('.propId').value() );
        //$hidden = $( this ).parents('.proposal').find('.propId');
    });
	
	//setGraphData(graph);
	//setCurrentUser(graph);
	//showCurrentUser(graph);
}
function setTriangleSize(svg, width, height) 
{
	gwidth = width || $(svg._container).innerWidth();
	gheight = height || $(svg._container).innerHeight();
	svg.configure({width: gwidth, height: gheight});
}
// *************
// Graphs
// *************
function loadSingleGraph(graph)
{
    clearGraphs();
    $('.graphcontainer').hide();
    $('#voting_graphs .controls').hide();
    $('.singlegraph').show();
    if (graph != null)
	{
	    $('.singlegraph').svg({loadURL: graph, onLoad: initGraph});
	}
}
function clearGraphs()
{
    if ($('#pfgraph').svg('get'))
	{
	    $('#pfgraph').svg('destroy').data('dataset', false);
	}
	if ($('#votesgraph').svg('get'))
	{
	    $('#votesgraph').svg('destroy').data('dataset', false);
	}
	if ($('.singlegraph').svg('get'))
	{
	    $('.singlegraph').svg('destroy').data('dataset', false);
	}
}
function loadGraphs(votesgraph, pfgraph)
{
	console.log("loadGraphs called: Loading ", votesgraph, " and ", pfgraph);
	clearGraphs();
	$('.singlegraph').hide();
	$('#voting_graphs .controls').show();
	
	$('.graphpanel').show();
	
	if (votesgraph != null)
	{
	    $('#votesgraph').svg({loadURL: votesgraph, onLoad: initGraph});
	}
	if (pfgraph != null)
	{
	    $('#pfgraph').svg({loadURL: pfgraph, onLoad: initGraph});
	}
}

function initGraph(svg)
{
	setGraphSize(svg);
	var graph = $(this);
	//setGraphData(graph);
	setProposalModals(svg);
	return;
	var userid = currentUserViewModel.userid();
	if (false && userid)
	{
	    setCurrentUser(userid, graph);
	    showCurrentUser(userid, graph);
	}
}

function resetGraphsForUser()
{
    var userid = currentUserViewModel.userid();
    console.log('resetGraphsForUser called... User ID = ' + userid);
    if (userid)
    {
        var graph1 = $('#votesgraph');
        if (graph1.svg('get'))
        {
            setCurrentUser(userid, graph1);
            showCurrentUser(userid, graph1);
        }
        var graph2 = $('#pfgraph');
         if (graph2.svg('get'))
         {
            setCurrentUser(userid, graph2);
            showCurrentUser(userid, graph2);
         }
    }
}
function resetGraphsAfterLogout()
{
    var userid = currentUserViewModel.userid();
    console.log('resetGraphsAfterLogout called... User ID = ' + userid);
    if (userid == 0)
    {
        var graph1 = $('#votesgraph');
        unsetCurrentUser(graph1);
        var graph2 = $('#pfgraph');
        unsetCurrentUser(graph2);
    }
}

function setGraphSize(svg, width, height) 
{
	console.log("setGraphSize called...");
	gwidth = width || $(svg._container).innerWidth();
	gheight = height || $(svg._container).innerHeight();
	svg.configure({width: gwidth-15, height: gheight});
}

function setProposal(prop, color)
{
    if (typeof prop == 'string')
	{
		prop = $('#'+id);
	}
	if (prop instanceof jQuery)
	{
		prop.find('polygon').attr('stroke', color);
	}
}

function setProposalGroup(propgroup, color)
{
	if (typeof propgroup == 'string')
	{
		propgroup = $('#'+id);
	}
	if (propgroup instanceof jQuery)
	{
		propgroup.find('polygon').attr('stroke', color);
	}
}

function setArrow(arrow, color)
{
    if (typeof arrow == 'string')
	{
		arrow = $('#'+id);
	}
	if (arrow instanceof jQuery)
	{
		arrow.find('path').css('stroke', color);
	    arrow.find('polygon').css('stroke', color).css('fill', color);
	}
}

function setUser(user, color, textcolor)
{
    if (typeof user == 'string')
	{
		user = $('#'+user);// assume id?
	}
	if (user instanceof jQuery)
	{
		user.find('polygon').attr('fill', color);
	    user.find('text').attr('fill', textcolor);
	}  
}

function groupWithUser(usergroup, id, color, textcolor)
{
    if (usergroup instanceof jQuery)
	{
		usergroup.children('polygon').eq(0).attr('stroke', color);
		var user = usergroup.find('a').filter(function() {
		   return $(this).attr('xlink:href') == 'u'+id;
	    });
		user.find('polygon').attr('fill', color);
	    user.find('text').attr('fill', textcolor);
	}
}

function setUserInGroup(userid, color, textcolor)
{
	var user = $('a').filter(function() {
	   return $(this).attr('xlink:href') == 'u'+userid;
    });
    user.find('polygon').attr('fill', color);
    user.find('text').attr('fill', textcolor);
    user.parent('g').children('polygon').eq(0).attr('stroke', color);
}
//------------------------------------------------------------//
function getUser(graph, userid)
{
	return $('.user, .usergroup', graph.svg('get').root()).filter(function() {
		return jQuery.inArray('u'+userid, $(this).data('users')) > -1;
	});
}
function getProposal(graph, propid)
{
	return $('.proposal, .proposalgroup', graph.svg('get').root()).filter(function() {
		return jQuery.inArray('p'+propid, $(this).data('proposals')) > -1;
	});
}
function getNode(nodeid, graph)
{
	return $('#'+nodeid, graph.svg('get').root()).eq(0);
}
// returns JQuery object of class arrow
function getPathsOutOfNodeID(nodeid, graph)
{
	return $('.arrow', graph.svg('get').root()).filter(function() {
		return $(this).data('source_id') == nodeid;
	});
}
function getPathsOutOfNode(node, graph)
{
	return getPathsOutOfNodeID(node.attr('id'), graph);
}
//------------------------------------------------------------//
function showCurrentUser(userid, graph)
{
	//console.log("showCurrentUser called...");
	var path = getUserPath(graph, userid);
	showVotes(path);
}

function getUserPath(graph, userid)
{
	var path = [];
	var user = getUser(graph, userid);
	var nodeid = user.attr('id');
	getPath(nodeid, path, graph);
	return path;
}
function showVotes(path)
{
	$.each(path, function(){
		$(this).addClass('voted');
	});
}
function hideVotes(path)
{
	$.each(path, function(){
		$(this).removeClass('voted');
	});
}

function getPath(nodeid, path, graph)
{
	//console.log("getPath called...");
	var node = getNode(nodeid, graph);
	path.push(node);
	
	var pathsout = getPathsOutOfNode(node, graph);
	if (pathsout.length == 0)
	{
		return;
	}
	else
	{
		pathsout.each(function(){
			path.push($(this));
			getPath($(this).data('target_id'), path, graph);
		});
	}
}
//-----------------------------------------------------------//
function endsWith(str, pattern)
{
    console.log(str + ' ' + pattern);
    var d = str.length - pattern.length;
    return d >= 0 && str.lastIndexOf(pattern) === d;
}

function unsetCurrentUser(graph)
{
	//console.log('unsetCurrentUser called...');
	$(graph).find('.currentuser').removeClass('currentuser');
	$(graph).find('.voted').removeClass('voted');
}

function setCurrentUser(userid, graph)
{
	//console.log("setCurrentUser called...");
	var currentuser = getUser(graph, userid);
	currentuser.addClass('currentuser');
	if (currentuser.hasClass('usergroup'))
	{
		var userlink = currentuser.find('a').filter(function() {
		   //return $(this).attr('xlink:href') == 'u='+userid;
		   //var ok = endsWith($(this).attr('xlink:href'), 'u='+userid);
		   var ok = $(this).attr('target') == userid;
		   return ok;
	    });
		userlink.addClass('currentuserlink');
	}
}


$('.mandotary').each(function(index, element) {
    var $element = $(element);
    if ($element.is('input')) {
        // code here
    } else if ($element.is('select')) {
        // code here
    }
});

function setProposalModals(svg)
{
    $('.proposal', svg.root()).each(function(){
        $(this).click(function(event){
            var pid = parseInt($(this).attr('id').replace( /^\D+/g, ''));
            console.log("setProposalModals: pid ==> " + pid);
            proposalsViewModel.showProposalNode(pid);
        });
	})
	/*
	$('.proposalgroup text', svg.root()).each(function(){
        $(this).click(function(event){
            var pid = parseInt($(this).text());
            console.log("setProposalModals: pid ==> " + pid);
            proposalsViewModel.showProposalNode(pid);
        });
	})*/
	
	var children = $('.proposalgroup', svg.root()).children();
	children.each(function(index, element)
	{
        if ($(element).is('text')) 
        {
            var pid = parseInt($(element).text());
            var box = children.get(index - 1);
            //$(box).attr('fill', 'lightblue') Forgot why I coloured these !?!
            $(box).click(function(event){
                console.log("setProposalModals: pid ==> " + pid);
                proposalsViewModel.showProposalNode(pid);
            });
        }
	})
}

// svg.toSVG()
function setGraphData(g)
{
	if (typeof g.data('dataset') != 'undefined' && g.data('dataset') == true)
	{
		// data set
		//console.log("Graph has data set - returning");
		return;
	}
	else
	{
		g.data('dataset', true);
	}

	var svg = g.svg('get');
	var checked = $('.node, .edge', svg.root());
	checked.each(function(i){
		var id = $(this).attr('id');
		if ($(this).hasClass('node'))
		{
			var pmatches = id.match(/p/g);
			if (pmatches)
			{
				if (pmatches.length > 1)
				{
					$(this).addClass('proposalgroup');
					$(this).data('nodetype', 'proposalgroup');
					// Set data
					var proposals = id.split('_');
					$(this).data('proposals', proposals);
				}
				else if (pmatches.length == 1)
				{
					$(this).addClass('proposal');
					$(this).data('nodetype', 'proposal');
					// Set data
					var proposals = [id];
					//console.log(proposals);
					$(this).data('proposals', proposals);
				}
			}
			else
			{
				var umatches = id.match(/u/g);
				if (umatches)
				{
					if (umatches.length > 1)
					{
						$(this).addClass('usergroup');
						$(this).data('nodetype', 'usergroup');
						// Set data
						var users = id.split('_');
						$(this).data('users', users);
					}
					else if (umatches.length == 1)
					{
						$(this).addClass('user');
						$(this).data('nodetype', 'user');
						// Set data
						var users = [id];
						$(this).data('users', users);
					}
				}
			}
		}
		else if ($(this).hasClass('edge') && id.match(/-/g))
		{	
			$(this).addClass('arrow');
			var data = id.split('--');
			$(this).data('source_id', data[0]);
			$(this).data('target_id', data[1]);
			var sources = data[0].split('_');
			var targets = data[1].split('_');
			$(this).data('targets', targets);
			$(this).data('sources', sources);
		}
	});
}