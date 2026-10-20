"""Real local-file import and persisted batch classification regressions."""
from browser_env import launch_browser
from pathlib import Path
from io import BytesIO
from zipfile import ZipFile, ZIP_DEFLATED
import os
import sys
from playwright.sync_api import sync_playwright

wanted = set(sys.argv[1:] or ['all'])
checks = 0
failures = []
def chk(value, text):
    global checks
    checks += 1
    if not value:
        failures.append(text)
        print('FAIL:', text)

def workbook(student_id):
    stream = BytesIO()
    with ZipFile(stream, 'w', ZIP_DEFLATED) as archive:
        archive.writestr('xl/workbook.xml', '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="学生" sheetId="1" r:id="rId1"/></sheets></workbook>')
        archive.writestr('xl/_rels/workbook.xml.rels', '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>')
        archive.writestr('xl/sharedStrings.xml', '<sst><si><t>姓名</t></si><si><t>学号</t></si><si><t>导入学生乙</t></si><si><t>' + student_id + '</t></si></sst>')
        archive.writestr('xl/worksheets/sheet1.xml', '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2" t="s"><v>3</v></c></row></sheetData></worksheet>')
    return stream.getvalue()

with sync_playwright() as p:
    browser = launch_browser(p)
    context = browser.new_context(viewport={'width': 1440, 'height': 1000})
    context.route('https://**/*', lambda route: route.fulfill(status=200, body='{}', content_type='application/json'))
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(Path(os.environ['ADM_HTML']).as_uri())
    E = page.evaluate
    E("enter('c5','L3');go('booking');S.tabs.booking='inv';render();ivb()")

    if 'all' in wanted or 'Q10' in wanted:
        E("mk({name:'导入学生甲',sid:'GPT0001A',lv:4,stage:'L2',queue:'batch'});mk({name:'导入学生乙',sid:'GPT0002A',lv:4,stage:'L2',queue:'batch'});render()")
        page.locator('[data-act=mo][data-arg="ivAdd:"]').click()
        page.locator('[data-act=fset][data-arg="ivt|file"]').click()
        page.locator('[data-iv-file]').set_input_files({'name': 'students.csv', 'mimeType': 'text/csv', 'buffer': b'Name,Student ID\r\n"A, student",GPT0001A\r\n'})
        page.wait_for_function('S.form.ivFile && !S.form.ivFileBusy')
        chk(page.locator('[data-bind="form.ivCol"]').input_value() == '1', 'Q10 CSV identifies student-ID column')
        chk('GPT0001A' in page.locator('#modal').inner_text(), 'Q10 CSV displays parsed student-ID sample')
        page.locator('[data-act=ivAddGo]').click()
        chk('导入学生甲' in page.locator('#modal').inner_text() and E("ivb().list.some(x=>SU(x.sid).sid==='GPT0001A')"), 'Q10 CSV adds matching student through normal review')
        E("ACT.mo('ivAdd:');S.form.ivt='file';render()")
        page.locator('[data-iv-file]').set_input_files({'name': 'students.xlsx', 'mimeType': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'buffer': workbook('GPT0002A')})
        page.wait_for_function('S.form.ivFile && !S.form.ivFileBusy')
        chk(page.locator('[data-bind="form.ivCol"]').input_value() == '1' and 'GPT0002A' in page.locator('#modal').inner_text(), 'Q10 XLSX reads ZIP/shared-strings and identifies student-ID column')
        page.locator('[data-act=ivAddGo]').click()
        chk(E("ivb().list.some(x=>SU(x.sid).sid==='GPT0002A')"), 'Q10 XLSX adds matching student')
        E("ACT.mo('ivAdd:');S.form.ivt='file';render()")
        page.locator('[data-iv-file]').set_input_files({'name': 'broken.xlsx', 'mimeType': 'application/octet-stream', 'buffer': b'not an Excel file'})
        page.wait_for_function('S.form.ivFileError && !S.form.ivFileBusy')
        chk('XLSX' in page.locator('#modal').inner_text() and E('S.form.ivFile') is None, 'Q10 invalid file gives a visible error and no candidate import')

    chk(not errors, 'no browser page errors: ' + repr(errors))
    browser.close()
print(f'gpt_import {",".join(sorted(wanted))}: {checks-len(failures)} passed, {len(failures)} failed')
raise SystemExit(bool(failures))
