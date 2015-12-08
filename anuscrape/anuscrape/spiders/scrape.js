// From http://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server
var download = function (filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

if(jQuery('#tFilterTitle').html().indexOf('Course') !== -1) {

    var failString = '',
        queue      = jQuery('<div></div>'),
        courses    = [],
        succeed    = 0,
        failed     = 0,
        id         = 1,
        total      = jQuery('#dlObject').find('option').length;

    jQuery('html').append('<div style="border: 3px solid #E3E3EF; border-radius: 10px; position: fixed; top: 45%; left: 40%; background: #FFF; padding: 20px 30px 20px 30px;" id="progress">Initializing..</div>');

    jQuery('#dlObject').find('option').each(function (i, courseElement) {
        var form = jQuery('#form1');
        queue.queue(function () {
            jQuery.post('http://timetabling.anu.edu.au/SWS2016/', {
                '__EVENTTARGET'       : '',
                '__EVENTARGUMENT'     : '',
                '__LASTFOCUS'         : '',
                '__VIEWSTATE'         : form.find('#__VIEWSTATE').val(),
                '__VIEWSTATEGENERATOR': form.find('#__VIEWSTATEGENERATOR').val(),
                '__EVENTVALIDATION'   : form.find('#__EVENTVALIDATION').val(),
                'tLinkType'           : 'modules',
                'dlFilter'            : '',
                'tWildcard'           : '',
                'dlObject'            : courseElement.value,
                'lbWeeks'             : '1-52',
                'lbDays'              : '1-7;1;2;3;4;5;6;7',
                'dlPeriod'            : '1-32;1;2;3;4;5;6;7;8;9;10;11;12;13;14;15;16;17;18;19;20;21;22;23;24;25;26;27;28;29;30;31;32;',
                'RadioType'           : 'module_list;cyon_reports_list_url;dummy',
                'bGetTimetable'       : 'View Timetable'
            }, function (html) {
                var html     = jQuery(html),
                    rows     = html.find('tbody > tr'),
                    fullName = html.find('[data-role="collapsible"] > h3:first').text().replace(/&nbsp;/g, ' ');
                rows.each(function (index, courseRow) {
                    var tds       = jQuery(courseRow).find('td'),
                        className = tds.eq(0).text().match(/([a-zA-Z0-9]+)_.+?\s(.+)/),
                        duration  = parseInt(tds.eq(5).text()),
                        hour      = parseInt(tds.eq(3).text());
                    for (var i = 0; i < duration; i++) {
                        courses.push({
                            fullName: fullName,
                            info    : className[2],
                            name    : className[1],
                            hour    : hour + i,
                            id      : id,
                            location: tds.eq(7).text(),
                            day     : tds.eq(2).text().toLowerCase().substr(0, 3)
                        });
                    }
                    id++;
                });
                succeed++;
                queue.dequeue();
            }).fail(function () {
                failString += (failString === '' ? '' : ', ') + courseElement.innerHTML;
                failed++;
                queue.dequeue();
            }).always(function () {
                jQuery('#progress').html('Succeed: ' + succeed + ', failed: ' + failed + ', total: ' + total);
            });
        });
    });

    queue.queue(function () {
        console.log('The following courses extraction has been failed: ' + failString);
        download('timetable.json', JSON.stringify(courses).replace(/},/g, '},\r\n'));
        queue.dequeue();
    });

} else {
    console.log('Please go to the pre-course-selection page.');
}