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

if (jQuery('#tFilterTitle').html().indexOf('Course') !== -1) {

    var failString = '',
        queue      = jQuery('<div></div>'),
        courses    = [],
        succeed    = 0,
        failed     = 0,
        id         = 1,
        nid        = 0,
        total      = jQuery('#dlObject').find('option').length,
        fullNames  = [],
        locations  = [],
        infos      = [];

    jQuery('html').append('<div style="border: 3px solid #E3E3EF; border-radius: 10px; position: fixed; top: 45%; left: 40%; background: #FFF; padding: 20px 30px 20px 30px;" id="progress">Initializing..</div>');

    jQuery('#dlObject').find('option').each(function (i, courseElement) {

        var form = jQuery('#form1');
        queue.queue(function () {
            jQuery.post('http://timetabling.anu.edu.au/sws2017/', {
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
				// Note this should be changed depending on the semester:
				// 29-46 for semester 2
                'lbWeeks'             : '29-46',
                'lbDays'              : '1-7;1;2;3;4;5;6;7',
                'dlPeriod'            : '1-32;1;2;3;4;5;6;7;8;9;10;11;12;13;14;15;16;17;18;19;20;21;22;23;24;25;26;27;28;29;30;31;32;',
                'RadioType'           : 'module_list;cyon_reports_list_url;dummy',
                'bGetTimetable'       : 'View Timetable'
            }, function (html) {
                var jhtml    = jQuery(html),
                    rows     = jhtml.find('tbody > tr'),
                    weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

                rows.each(function (index, courseRow) {
                    var tds       = jQuery(courseRow).find('td'),
                        className = tds.eq(0).text().trim().match(/([a-zA-Z0-9]+)_.+?\s(.+)/) || ['', '', ''],
                        location  = tds.eq(7).text().trim(),
                        lid       = jQuery.inArray(location, locations),
                        iid       = jQuery.inArray(className[2], infos);

                    if (lid === -1) {
                        lid = locations.length;
                        locations.push(location);
                    }
                    if (iid === -1) {
                        iid = infos.length;
                        infos.push(className[2]);
                    }
                    courses.push({
                        id   : id,
                        nid  : nid,
                        iid  : iid,
                        lid  : lid,
                        start: parseFloat(tds.eq(3).text().replace(':30', '.5')),
                        dur  : parseFloat(tds.eq(5).text().replace(':30', '.5')),
                        day  : weekdays.indexOf(tds.eq(2).text().toLowerCase().substr(0, 3))
                    });

                    id++;
                });
                succeed++;

                if (rows.length > 0) {
                    fullNames.push(jhtml.find('[data-role="collapsible"] > h3:first').text().replace(/&nbsp;/g, ' '));
                    nid++;
                }

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
        download('timetable.json', JSON.stringify([fullNames, infos, locations, courses]).replace(/(}|]),/g, '$1,\r\n'));
        queue.dequeue();
    });

} else {
    console.log('Please go to the pre-course-selection page.');
}
