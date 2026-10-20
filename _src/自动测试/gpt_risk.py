"""Risk-report regressions for the v1.19.2 source fixes (1440 x 1000)."""
import argparse
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_env import launch_browser


SETUP = """() => {
  enter('c5', 'L3');
  const s = STU.find(s => !CRISES.some(k => k.sid === s.id && k.st !== 'closed'));
  window.riskSid = s.id;
  window.makeRiskRec = (text, personal = '') => {
    S.mo = null; S.rec = Object.assign(recNew(riskSid), {
      who: ['本人'], mode: '面对面', place: '办公室', result: '已谈',
      situ: text, pp: { [riskSid]: { txt: personal } }, done: [], sis: false,
      shares: [], types: [], next: '不需要'
    });
  };
  window.activeRisk = () => CRISES.filter(k => k.sid === riskSid && k.st !== 'closed');
  window.closeRisk = () => { activeRisk().forEach(k => k.st = 'closed'); SU(riskSid).stage = 'follow'; };
} """


def r10(page):
    page.evaluate("""() => {
      makeRiskRec('学生说：绝望'); recSave(false);
      window.riskTid = TALKS[TALKS.length - 1].id; closeRisk();
      S.rec = recFrom(TALKS.find(t => t.id === riskTid)); S.rec.situ += '。现在想死';
      recSave(false);
    }""")
    assert page.evaluate("activeRisk().length === 1 && activeRisk()[0].urgent"), 'new level-1 wording in an already risky record must report'
    page.evaluate("""() => {
      closeRisk(); S.rec = recFrom(TALKS.find(t => t.id === riskTid)); recSave(false);
    }""")
    assert page.evaluate("activeRisk().length === 0"), 'unchanged wording must not create duplicate reports'
    page.evaluate("""() => {
      makeRiskRec('情况已了解', '学生感到绝望'); recSave(false);
      window.personalTid = TALKS[TALKS.length - 1].id; closeRisk();
      S.rec = recFrom(TALKS.find(t => t.id === personalTid));
      S.rec.pp[riskSid].txt += '。想结束生命'; recSave(false);
    }""")
    assert page.evaluate("activeRisk().length === 1 && activeRisk()[0].urgent"), 'new level-1 wording in personal text must report'
    assert page.evaluate("AUDIT.some(a => a.k === 'report' && a.sid === riskSid)"), 'report must be audited'


def r11(page):
    for received in (False, True):
        page.evaluate("""received => {
          closeRisk(); makeRiskRec('学生说：绝望'); recSave(false);
          window.riskTid = TALKS[TALKS.length - 1].id; window.existingRiskId = activeRisk()[0].id;
          const k = activeRisk()[0]; k.at = new Date(NOW - 5 * H); window.originalRiskAt = +k.at;
          if (received) { k.st = 'handling'; k.recv = { by: 'c4', at: new Date(NOW - H) }; }
          S.form = { add: '学生发消息说：现在想死' }; ACT.tkAddGo(riskTid);
        }""", received)
        assert page.evaluate("activeRisk().length === 1 && activeRisk()[0].id === existingRiskId"), 'append must attach to one existing crisis'
        assert page.evaluate("activeRisk()[0].urgent && activeRisk()[0].st === 'new' && !activeRisk()[0].recv"), 'new level-1 event must wait for urgent confirmation'
        assert page.evaluate("+activeRisk()[0].at === originalRiskAt && activeRisk()[0].urgentAt && cLeft(activeRisk()[0]) > 0.4"), 'urgent timer must start with upgrade without losing original source time'
        assert page.evaluate("NOTI.some(n => n.ref === existingRiskId && n.ch.includes('电话') && n.t.includes('30 分钟'))"), 'upgrade must call the duty counselor with a 30-minute limit'
        assert page.evaluate("AUDIT.some(a => a.k === 'report' && a.t.includes('已附到现有危机'))"), 'append to existing crisis must be audited'
        if received:
            assert page.evaluate("activeRisk()[0].recvHistory.length === 1"), 'prior confirmation must remain in history'
        page.evaluate("""() => {
          const k = activeRisk()[0]; NOW.setTime(+k.urgentAt + 29 * 60e3); tick();
        }""")
        assert page.evaluate("activeRisk()[0].esc === 0"), 'upgrade must not escalate before 30 minutes'
        page.evaluate("NOW.setTime(+activeRisk()[0].urgentAt + 31 * 60e3); tick()")
        assert page.evaluate("activeRisk()[0].esc === 1"), 'unconfirmed upgrade must escalate after 30 minutes'
        assert page.evaluate("activeRisk()[0].recs.filter(id => id === riskTid).length === 1"), 'one record reference per existing crisis'
    page.evaluate("""() => {
      closeRisk(); makeRiskRec('学生说：绝望'); recSave(false);
      window.existingRiskId = activeRisk()[0].id; window.riskTid = TALKS[TALKS.length - 1].id;
      S.rec = recFrom(TALKS.find(t => t.id === riskTid)); S.rec.situ += '。想结束生命'; recSave(false);
    }""")
    assert page.evaluate("activeRisk().length === 1 && activeRisk()[0].id === existingRiskId && activeRisk()[0].urgent"), 'edited record must also upgrade the existing crisis'


def r18(page):
    page.evaluate("""() => {
      makeRiskRec('最近睡不着'); recSave(false);
      window.riskTid = TALKS[TALKS.length - 1].id;
    }""")
    assert page.evaluate("activeRisk().length === 0 && !TALKS.find(t => t.id === riskTid).risk"), 'level-3 signal must not report'
    assert page.evaluate("TALKS.find(t => t.id === riskTid).auxSignals.some(x => x.word === '睡不着' && x.source === 'record')"), 'level-3 common text must persist as auxiliary metadata'
    page.evaluate("S.rv = riskTid; S.mo = null")
    assert page.evaluate("recView().includes('辅助信号（不单独报告）')"), 'staff record view must identify auxiliary signal'
    page.evaluate("""() => {
      S.form = { add: '最近很悲伤' }; ACT.tkAddGo(riskTid);
      S.form = { add: '并非悲伤' }; ACT.tkAddGo(riskTid);
    }""")
    assert page.evaluate("activeRisk().length === 0 && TALKS.find(t => t.id === riskTid).auxSignals.filter(x => x.word === '悲伤').length === 1"), 'append auxiliary signals must persist and negated terms must not'
    page.evaluate("""() => {
      S.rec = recFrom(TALKS.find(t => t.id === riskTid)); S.rec.situ = '情况已经了解'; recSave(false);
    }""")
    assert page.evaluate("!TALKS.find(t => t.id === riskTid).auxSignals.some(x => x.source === 'record') && TALKS.find(t => t.id === riskTid).auxSignals.some(x => x.source === 'append')"), 'editing updates current signals while preserving append signals'
    page.evaluate("makeRiskRec('现在想死，也睡不着'); recSave(true)")
    assert page.evaluate("activeRisk().length === 0 && !TALKS[TALKS.length - 1].auxSignals && S.toast.includes('草稿不会自动报告')"), 'draft is reminder-only for all tiers'


CASES = {'R10': r10, 'R11': r11, 'R18': r18}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--case', choices=CASES)
    args = parser.parse_args()
    passed = 0
    with sync_playwright() as p:
        browser = launch_browser(p)
        for name, run in CASES.items():
            if args.case and args.case != name:
                continue
            context = browser.new_context(viewport={'width': 1440, 'height': 1000})
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(Path(os.environ['ADM_HTML']).as_uri())
            page.wait_for_timeout(200)
            page.evaluate(SETUP)
            run(page)
            page.evaluate('render()')
            assert not errors, errors
            passed += 1
            print(f'{name}: passed (1440 x 1000, no browser errors)')
            context.close()
        browser.close()
    print(f'gpt_risk: {passed} cases passed')


if __name__ == '__main__':
    main()
