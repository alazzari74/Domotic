/*
//http://msdn.microsoft.com/en-us/library/8kb3ddd4%28v=vs.110%29.aspx
--------------------------------------------------------------------------------------------------------------------------
Format      Description                                                                 Date Example                Output
--------------------------------------------------------------------------------------------------------------------------
"d"         The day of the month, from 1 through 31.                                    5/1/2014 1:45:30 PM         1
"dd"        The day of the month, from 01 through 31.                                   5/1/2014 1:45:30 PM         01
"ddd"       The abbreviated name of the day of the week.                                5/15/2014 1:45:30 PM        Thu
"dddd"      The full name of the day of the week.                                       5/15/2014 1:45:30 PM        Thursday
"f"         The tenths of a second in a date and time value.                            5/15/2014 13:45:30.617      6
"ff"        The hundredths of a second in a date and time value.                        5/15/2014 13:45:30.617      61
"fff"       The milliseconds in a date and time value.                                  5/15/2014 13:45:30.617      617
"F"         If non-zero, the tenths of a second in a date and time value.               5/15/2014 13:45:30.617      6
"FF"        If non-zero, the hundredths of a second in a date and time value.           5/15/2014 13:45:30.617      61
"FFF"       If non-zero, the milliseconds in a date and time value.                     5/15/2014 13:45:30.617      617
"h"         The hour, using a 12-hour clock from 1 to 12.                               5/15/2014 1:45:30 AM        1
"hh"        The hour, using a 12-hour clock from 01 to 12.                              5/15/2014 1:45:30 AM        01
"H"         The hour, using a 24-hour clock from 0 to 23.                               5/15/2014 1:45:30 AM        1
"HH"        The hour, using a 24-hour clock from 00 to 23.                              5/15/2014 1:45:30 AM        01
"m"         The minute, from 0 through 59.                                              5/15/2014 1:09:30 AM        9
"mm"        The minute, from 00 through 59.                                             5/15/2014 1:09:30 AM        09
"M"         The month, from 1 through 12.                                               5/15/2014 1:45:30 PM        6
"MM"        The month, from 01 through 12.                                              5/15/2014 1:45:30 PM        06
"MMM"       The abbreviated name of the month.                                          6/15/2014 1:45:30 PM        Jun
"MMMM"      The full name of the month.                                                 6/15/2014 1:45:30 PM        June
"s"         The second, from 0 through 59.                                              5/15/2014 1:45:09 PM        9
"ss"        The second, from 00 through 59.                                             5/15/2014 1:45:09 PM        09
"t"         The first character of the AM/PM designator.                                5/15/2014 1:45:30 PM        P
"tt"        The AM/PM designator.                                                       5/15/2014 1:45:30 PM        PM
"y"         The year, from 0 to 99.                                                     5/15/2014 1:45:30 PM        9
"yy"        The year, from 00 to 99.                                                    5/15/2014 1:45:30 PM        09
"yyy"       The year, with a minimum of three digits.                                   5/15/2009 1:45:30 PM        2009
"yyyy"      The year as a four-digit number.                                            5/15/2014 1:45:30 PM        2009
"yyyyy"     The year as a five-digit number.                                            5/15/2014 1:45:30 PM        02009
"z"         Hours offset from UTC, with no leading zeros.                               5/15/2014 1:45:30 PM -07:00 -7
"zz"        Hours offset from UTC, with a leading zero for a single-digit value.        5/15/2014 1:45:30 PM -07:00 -07
"zzz"       Hours and minutes offset from UTC.                                          5/15/2014 1:45:30 PM -07:00 -07:00
"st"        Date ordinal (st, nd, rd and th) display from day of the date.              5/15/2014 1:45:30 PM        15th
--------------------------------------------------------------------------------------------------------------------------
*/
var dayNames = ['Sun', 'Mon', 'Tues', 'Wednes', 'Thurs', 'Fri', 'Satur'];
var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
Date.prototype.format = function (format) {
    var wordSplitter = /\W+/, _date = this;
    this.Date = function (format) {
        var words = format.split(wordSplitter);
        words.forEach(function(w) {
            if (typeof(wordReplacer[w]) === "function") {
                format = format.replace(w, wordReplacer[w]() );
            }
            else {
                wordReplacer['e'](w);
            }
        });
        return format.replace(/\s+(?=\b(?:st|nd|rd|th)\b)/g, "");
    };
    var wordReplacer = {
        //The day of the month, from 1 through 31. (eg. 5/1/2014 1:45:30 PM, Output: 1)
        d : function() {
            return _date.getDate();
        },
        //The day of the month, from 01 through 31. (eg. 5/1/2014 1:45:30 PM, Output: 01)
        dd : function() {
            return _pad(_date.getDate(),2);
        },
        //The abbreviated name of the day of the week. (eg. 5/15/2014 1:45:30 PM, Output: Mon (en-US))
        ddd : function() {
            return dayNames[_date.getDay()].slice(0,3);
        },
        //The full name of the day of the week. (eg. 5/15/2014 1:45:30 PM, Output: Monday (en-US))
        dddd : function() {
            return dayNames[_date.getDay()] + 'day';
        },
        //The tenths of a second in a date and time value. (eg. 5/15/2014 13:45:30.617, Output: 6)
        f : function() {
            return parseInt(_date.getMilliseconds() / 100) ;
        },
        //The hundredths of a second in a date and time value.  (eg. 5/15/2014 13:45:30.617, Output: 61)
        ff : function() {
            return parseInt(_date.getMilliseconds() / 10) ;
        },
        //The milliseconds in a date and time value. (eg. 5/15/2014 13:45:30.617, Output: 617)
        fff : function() {
            return _date.getMilliseconds() ;
        },
        //If non-zero, The tenths of a second in a date and time value. (eg. 5/15/2014 13:45:30.617, Output: 6)
        F : function() {
            return (_date.getMilliseconds() / 100 > 0) ? parseInt(_date.getMilliseconds() / 100) : '' ;
        },
        //If non-zero, The hundredths of a second in a date and time value.  (eg. 5/15/2014 13:45:30.617, Output: 61)
        FF : function() {
            return (_date.getMilliseconds() / 10 > 0) ? parseInt(_date.getMilliseconds() / 10) : '' ;
        },
        //If non-zero, The milliseconds in a date and time value. (eg. 5/15/2014 13:45:30.617, Output: 617)
        FFF : function() {
            return (_date.getMilliseconds() > 0) ? _date.getMilliseconds() : '' ;
        },
        //The hour, using a 12-hour clock from 1 to 12. (eg. 5/15/2014 1:45:30 AM, Output: 1)
        h : function() {
            return _date.getHours() % 12 || 12;
        },
        //The hour, using a 12-hour clock from 01 to 12. (eg. 5/15/2014 1:45:30 AM, Output: 01)
        hh : function() {
            return _pad(_date.getHours() % 12 || 12, 2);
        },
        //The hour, using a 24-hour clock from 0 to 23. (eg. 5/15/2014 1:45:30 AM, Output: 1)
        H : function() {
            return _date.getHours();
        },
        //The hour, using a 24-hour clock from 00 to 23. (eg. 5/15/2014 1:45:30 AM, Output: 01)
        HH : function() {
            return _pad(_date.getHours(),2);
        },
        //The minute, from 0 through 59. (eg. 5/15/2014 1:09:30 AM, Output: 9
        m : function() {
             return _date.getMinutes()();
        },
        //The minute, from 00 through 59. (eg. 5/15/2014 1:09:30 AM, Output: 09
        mm : function() {
            return _pad(_date.getMinutes(),2);
        },
        //The month, from 1 through 12. (eg. 5/15/2014 1:45:30 PM, Output: 6
        M : function() {
            return _date.getMonth() + 1;
        },
        //The month, from 01 through 12. (eg. 5/15/2014 1:45:30 PM, Output: 06
        MM : function() {
            return _pad(_date.getMonth() + 1,2);
        },
        //The abbreviated name of the month. (eg. 5/15/2014 1:45:30 PM, Output: Jun (en-US)
        MMM : function() {
            return monthNames[_date.getMonth()].slice(0, 3);
        },
        //The full name of the month. (eg. 5/15/2014 1:45:30 PM, Output: June (en-US)
        MMMM : function() {
            return monthNames[_date.getMonth()];
        },
        //The second, from 0 through 59. (eg. 5/15/2014 1:45:09 PM, Output: 9)
        s : function() {
            return _date.getSeconds();
        },
        //The second, from 00 through 59. (eg. 5/15/2014 1:45:09 PM, Output: 09)
        ss : function() {
            return _pad(_date.getSeconds(),2);
        },
        //The first character of the AM/PM designator. (eg. 5/15/2014 1:45:30 PM, Output: P (en-US))
        t : function() {
            return _date.getHours() >= 12 ? 'P' : 'A';
        },
        //The AM/PM designator. (eg. 5/15/2014 1:45:30 PM, Output: PM (en-US))
        tt : function() {
            return _date.getHours() >= 12 ? 'PM' : 'AM';
        },
        //The year, from 0 to 99. (eg. 5/15/2014 1:45:30 PM, Output: 9)
        y : function() {
            return Number(_date.getFullYear().toString().substr(2,2));
        },
        //The year, from 00 to 99. (eg. 5/15/2014 1:45:30 PM, Output: 09)
        yy : function() {
            return _pad(_date.getFullYear().toString().substr(2,2),2);
        },
        //The year, with a minimum of three digits. (eg. 5/15/2014 1:45:30 PM, Output: 2009)
        yyy : function() {
            var _y = Number(_date.getFullYear().toString().substr(1,2));
            return _y > 100 ? _y : _date.getFullYear();
        },
        //The year as a four-digit number. (eg. 5/15/2014 1:45:30 PM, Output: 2009)
        yyyy : function() {
            return _date.getFullYear();
        },
        //The year as a five-digit number. (eg. 5/15/2014 1:45:30 PM, Output: 02009)
        yyyyy : function() {
            return _pad(_date.getFullYear(),5);
        },
        //Hours offset from UTC, with no leading zeros. (eg. 5/15/2014 1:45:30 PM -07:00, Output: -7)
        z : function() {
            return parseInt(_date.getTimezoneOffset() / 60) ; //hourse
        },
        //Hours offset from UTC, with a leading zero for a single-digit value. (eg. 5/15/2014 1:45:30 PM -07:00, Output: -07)
        zz : function() {
            var _h =  parseInt(_date.getTimezoneOffset() / 60); //hourse
            if(_h < 0) _h =  '-' + _pad(Math.abs(_h),2);
            return _h;
        },
        //Hours and minutes offset from UTC. (eg. 5/15/2014 1:45:30 PM -07:00, Output: -07:00)
        zzz : function() {
            var _h =  parseInt(_date.getTimezoneOffset() / 60); //hourse
            var _m = _date.getTimezoneOffset() - (60 * _h);
            var _hm = _pad(_h,2) +':' + _pad(Math.abs(_m),2);
            if(_h < 0) _hm =  '-' + _pad(Math.abs(_h),2) +':' + _pad(Math.abs(_m),2);
            return _hm;
        },
        //Date ordinal display from day of the date. (eg. 5/15/2014 1:45:30 PM, Output: 15th)
        st: function () {
            var _day = wordReplacer.d();
            return _day < 4 | _day > 20 && ['st', 'nd', 'rd'][_day % 10 - 1] || 'th';
        },
        e: function (method) {
            throw 'ERROR: Not supported method [' + method + ']';
        }
    };
    _pad = function (n, c) {
        if ((n = n + '').length < c) {
            return new Array((++c) - n.length).join('0') + n;
        }
        return n;
    }
    return this.Date(format);
}

