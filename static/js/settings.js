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
// client domain
var VILFREDO_URL = 'http://127.0.0.1:8080';

// API version
var API_VERSION = 'v2';

// static files URL
var STATIC_FILES = VILFREDO_URL;

// API URL
var VILFREDO_API_URL = VILFREDO_URL;

// algorithm version number
var ALGORITHM_VERSION = 2;

var LOAD_GOOGLE_ANALYTICS = true;

var USE_MARKDOWN_IN_QUESTION_TEXT = false;

// radius of circle representing a vote
var RADIUS;
var width = window.innerWidth, height = window.innerHeight;

if ((width <= 500) && (height <= 500)) 
{
    RADIUS = 6;
}
else
{
    RADIUS = 10;
}  

var DEFAULT_MAP_TYPE = 'all';
var LINEAR_RESULTS_MAP_OFFSET_Y = 70;
var LINEAR_MAP_OFFSET_Y = 100;
var LINEAR_MAP_HEIGHT = 41;
var LINEAR_MAP_VOTE_WIDTH = 4;
var MEDIAN_COLOR = '#BEBEBE';
var MEDIAN_SELECTED_COLOR = '#7e7e7e';
var MEDIAN_WINNER_COLOR = '#FFA500';
var MEDIAN_WINNER_SELECTED_COLOR = '#B77600';

var MAX_EMAIL_DISAPLAY_CHARS = 24;
var MAX_USERNAME_DISAPLAY_CHARS = 24;
var MAX_LINKS_IN_QUESTION = 3;
var MAX_COMMENT_DISAPLAY_CHARS = 150;
var PROPOSAL_ABSTRACT_REQUIRED_LENGTH = 2000;
var MIN_VOTERS_BEFORE_MOVEON = 1;
var RESULTS_VOTING_MIN_VOTERS = 1;
var SITE_INVITE_ONLY = false;
var SITE_INVITE_ONLY_MESSAGE = 'Registration on this site is by invitation only! Click link to go to alternate site.';
var SITE_INVITE_ONLY_LINK_URL = 'http://demo-site.com';
var SITE_INVITE_ONLY_LINK_TEXT = 'Vilfredo Demo Site';

// Don't edit below
//
var VILFREDO_API = VILFREDO_API_URL + '/api/' + API_VERSION;

var Q_READ = 0x1
var Q_VOTE = 0x2
var Q_PROPOSE = 0x4
var Q_INVITE = 0x8


