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
		self.getAuthToken = function()
		{
			var URI = VILFREDO_API +'/authtoken';
			$.cookie('vgaclient', null, { path: '/' });
			self.authToken = '';
			return ajaxRequest(URI, 'GET').done(function(data, textStatus, jqXHR) {
			    self.authToken = data.token;
				loginViewModel.close();
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
        self.room = ko.observable('');
        self.title = ko.observable('');
        self.blurb = ko.observable('');
        self.minimum_time = ko.observable({});
        self.maximum_time = ko.observable({});

        self.availableTimePeriods = ko.observableArray([
           new TimePeriod("1 second", 1),
           new TimePeriod("1 minute", 60),
           new TimePeriod("1 hour", 3600),
           new TimePeriod("1 day", 86400),
           new TimePeriod("1 week", 604800),
           new TimePeriod("30 days", 2592000)
        ]);
        
        self.reset = function()
        {
			self.room('');
            self.title('');
            self.blurb('');
            self.minimum_time({});
            self.maximum_time({});
            $('#addquestion .alert').css('display', 'none').html('');
        }
        self.close = function()
        {
            self.reset();
            $('#addquestion').modal('hide');
        }
        self.add = function()
		{
			console.log("NewQuestionViewModel.add() called ...");
			
			questionsViewModel.addQuestion({
                room: self.room(),
                title: self.title(),
                blurb: self.blurb(),
                minimum_time: self.minimum_time().seconds,
                maximum_time : self.maximum_time().seconds
            });
		}
	}
	
	function RegisterViewModel()
	{
	    var self = this;
	    self.username = ko.observable('');
        self.password = ko.observable('');
        self.email = ko.observable('');
	    
	    self.reset = function()
        {
			self.username('');
            self.password('');
            self.email('');
            $('#register .alert').css('display', 'none').html('');
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
					
					registerViewModel.close();
					
					$('.main.alert')
					.html("Congratulations, you just registered with Vilfredo! You can now log in using your password.")
					.setAlertClass('success')
					.fadeIn()
				}
				else //here
				{
					console.log("RegisterViewModel.register failed with status " + jqXHR.status);
					$('#register .alert')
					.html(data.message)
					.setAlertClass('danger')
					.fadeIn()
				}
			}).fail(function(jqXHR) 
    		{
    			console.log('register: There was an error with register. Error ' + jqXHR.status);
    			$('#register .alert')
				.html(JSON.parse(jqXHR.responseText).message)
				.setAlertClass('danger')
				.fadeIn()
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
        
		self.logout = function()
		{
			alert("logout  called...");
			self.username = "";
			self.password = "";
			self.currentuser("");
		}
		self.clear = function()
		{
			self.username(''); 
			self.password('');
			self.remember(false);
		}
		self.close = function()
		{
			$('#login .message').text('').hide();
			self.username(''); 
			self.password('');
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
        self.title = ko.observable('');
        self.abstract = ko.observable('');
        self.blurb = ko.observable('');

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
		self.comment = ko.observable();
		self.comment_type = ko.observable();
		self.setProposal = function(proposal)
		{
			self.proposal = proposal;
		}
		
		self.resetNewCommentPanel = function()
		{
			console.log("resetNewCommentPanel called..");
			var panel = $('.newcommentpanel');
			if ($('.newcommentpanel').is(":visible"))
			{
	          return panel.slideUp(400);
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
	        } 
			else 
			{
	          panel.slideDown(400);
	        }
		}
		self.add = function()
		{
			console.log("NewCommentViewModel.add() called ...");
			self.showNewCommentPanel();			
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
            self.comment("");
            self.comment_type("");
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
			newCommentViewModel.resetNewCommentPanel();
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
			newCommentViewModel.resetNewCommentPanel();
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
			newCommentViewModel.resetNewCommentPanel();
			var $showing = $('#propdetails, #showcomments').filter(function() {
			   return $(this).is(':visible');
		    });
			$showing.fadeOut(function()
			{
				$('#showquestions').fadeIn();
			});
		}
		
		self.test = function()
		{
			alert('test called for no fucking reason...');
		}
		
		self.beginNewComment = function(operation, proposalmodel, reply_to)
		{
			console.log('beginNewComment called with op ' + operation);
			//return;
			newCommentViewModel.setProposal(proposalmodel);
			$.when(newCommentViewModel.resetNewCommentPanel()).done(function()
			{
				if (operation == 'question')
				{
					$('.newcommentpanel #new_comment_type').attr('value', 'question');
					$('.newcommentpanel h4').text('Ask the author of the proposal a question');
					$('.newcommentpanel #form-type-select').addClass('hidden');
					$('.newcommentpanel #comment-label').text('Question');
					$('.newcommentpanel textarea').attr('placeholder', 'Question Text');
				}
				else if (operation == 'answer')
				{
					$('.newcommentpanel #new_comment_type').attr('value', 'answer');
					$('.newcommentpanel #reply_to').attr('value', reply_to);
					$('.newcommentpanel h4').text('Answer this question');
					$('.newcommentpanel #form-type-select').addClass('hidden');
					$('.newcommentpanel #comment-label').text('Answer');
					$('.newcommentpanel textarea').attr('placeholder', 'Answer Text');
				}
				else // comment
				{
					$('.newcommentpanel #new_comment_type').attr('value', 'comment');
					$('.newcommentpanel h4').text('Add a point for or aginst this proposal');
					$('.newcommentpanel #form-type-select').removeClass('hidden');
					$('.newcommentpanel #comment-label').text('Comment');
					$('.newcommentpanel textarea').attr('placeholder', 'Comment Text');
				}
				console.log('comment_type default = ' + newCommentViewModel.comment_type());
				newCommentViewModel.showNewCommentPanel();
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
					alert(jqXHR.status);
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
					alert(jqXHR.status);
				}
			});
		}
		
		self.setIndex = function(index)
		{
			self.index = index;
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
				
				if ($('.votebox').svg('get'))
                {
                    console.log('Removing svg from votebox------------');
                    $('.votebox').svg('destroy').data('pid', false).data('index', false);
                }
				
				$('.votebox').data('pid', self.proposal.id).addClass('threeway').data('index', self.index);
				//$('.votebox').svg({loadURL: flask_util.url_for('static', {filename:'images/triangle.svg'}),
				$('.votebox').svg({loadURL: STATIC_FILES + '/images/triangle.svg',
								   onLoad: self.init3WayTriangle});
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
	    
	    self.addQuestion = function(question) //here
		{
			console.log("QuestionsViewModel.addQuestion() called...");
			console.log(question);
			var URI = VILFREDO_API + '/questions';
			ajaxRequest(URI, 'POST', question).done(function(data, textStatus, jqXHR) {
			    console.log('Add question data returned...');
				console.log(data);
				
				if (jqXHR.status == 201)
				{
					newQuestionViewModel.close();
					
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
	            console.log('Current user IS a key player');
	            console.log(match.id());
            }
            else
            {
                console.log('Current user IS NOT a key player');
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
		
		self.showProposalNode = function(proposal_id)
		{
		    console.log("ProposalsViewModel.showProposalNode() called with pid = " + proposal_id);
		    var index = arrayFirstIndexOf(proposalsViewModel.proposals(), function(item) {
               return item.id() === proposal_id;    
            });
            var proposal = proposalsViewModel.proposals()[index];
		    self.read(index, proposal);
		}
		
		self.fetchIndex = function(id)
		{
		    
		}
		
		self.readproposal = function(id)
		{
		    console.log("ProposalsViewModel.readproposal called with id " + id);
		    index = self.fetchIndex(id);
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
    		  		addProposalViewModel.close();
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
					alert(jqXHR.status);
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
			return ajaxRequest(VILFREDO_API + '/questions/' + question_id + '/key_players', 'GET').done(function(data, textStatus, jqXHR) {
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

		self.fetchProposals = function(options) {
		    console.log('fetchProposals() called...');
			var proposalsURI = VILFREDO_API + '/questions/'+ question_id +'/proposals';
			var proposals_list = self.proposals;
			
		    if (options != null && options.user_only != null)
		    {
		        proposalsURI = proposalsURI + '?user_only=true';
		    }
		    else if (options != null && options.inherited_only != null)
		    {
		        proposalsURI = proposalsURI + '?inherited_only=true';
		        // Add to inherited list
		        proposals_list = self.inherited_proposals;
		    }
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
						comment_count: ko.observable(parseInt(data.proposals[i].comment_count))
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
	
	var username = "";//"john";
	var password = "";//"test123";
	/*
	var question_id;
	if ($.url().fsegment(1) == 'question')
	{
		question_id = $.url().fsegment(2);
	}
	else
	{
		question_id = 1;
	}*/
	
	
	//var params = $.url().param();
	//console.log('Params = ' + params);
	//var question_id = (params.question) ? params.question : 3;
	//var question_id = ($.url().fsegment(1) == 'question') ? $.url().fsegment(2) : 1;
	
	var question_id = getQuerySegment('question');
	
	console.log(question_id);
	//question_id = 1;
		
	var room = $.url().param('room') ? $.url().param('room') : '';
	
	console.log(room);
	
	var currentUserViewModel;
	var proposalsViewModel;
	var questionViewModel;
	var viewProposalViewModel;
    var loginViewModel;
	var addProposalViewModel;
	var newQuestionViewModel;
	var svggraph;
	var userid = false;
	var votesgraph;// =    'static/maps/map_Q1_G1_all_1_1.svg';
	var pfvotesgraph;// = 	'static/maps/map_Q1_G1_pareto_1_1.svg';
	var triangle;
	
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
		svg.configure({width: gwidth, height: gheight});
	}
	
	function initTriangle(svg)
	{
		var tri = $('#votenowwindow .showtriangle .votenow');
		$('#votenowwindow .showtriangle .votenow').on( "click", function(e) {
        	var posX = $(this).offset().left,
            posY = $(this).offset().top;
        	alert((e.pageX - posX) + ' , ' + (e.pageY - posY));
		});
	}
	

	function init3WayTriangle(svg)
	{
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
        	alert("I oppose");
			pid = $(this).parents('.threeway').data('pid');
			alert("I oppose proposal " + pid);
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
        	alert("I endorse");
			pid = $(this).parents('.threeway').data('pid');
			alert("I endorse proposal " + pid);
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
        	alert("I am confused");
			pid = $(this).parents('.threeway').data('pid');
			alert("I am confused by proposal " + pid);
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
		self.room = ko.observable();
		self.last_move_on = ko.observable();
		self.minimum_time = ko.observable();
		self.maximum_time = ko.observable();
		self.created;
		
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
        		self.room(data.question.room);
        		self.last_move_on(parseInt(data.question.last_move_on));
        		self.minimum_time(parseInt(data.question.minimum_time));
        		self.maximum_time(parseInt(data.question.maximum_time));
        		self.generation(data.question.generation);
        		self.created = parseInt(data.question.created);
        		
        		/*
        		$(".question-info").each(function(){
    			    ko.applyBindings(questionViewModel, $(this)[0]);
    			});*/
		    });
	    }
	}
	
	function fetchGraph(map_type, generation)
	{
		var URI = VILFREDO_API + '/questions/'+ question_id +'/graph?generation=' + generation + '&map_type=' + map_type;		
		
		return ajaxRequest(URI, 'GET').done(function(data) {
		    console.log('fetchGraph data returned...');
			console.log(data);
		});
	}
	
	function fetchGraphs(question)
	{
	    generation = parseInt(question['generation']);
	    if (question.phase == 'writing' && generation > 1)
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
			if (graph_resp[2].status == 204)
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
		$.when(fetchGraph('all', 1), fetchGraph('pareto', 1)).done(function( all, pareto )
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
	
	function getQuerySegment(variable)
	{
        //var params = $.url('0.0.0.0:8080/room/vilfredo/question/2').segment();
		var params = $.url().segment();
		var match = params.indexOf(variable);
		console.log('getQueryVariable: match index = ' + match);
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
        	alert((e.pageX - posX) + ' , ' + (e.pageY - posY));
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
