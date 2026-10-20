# 灵屿 2.0 · v1.19.2-gpt 审查分支

本分支从 `forayu` 的 `1a1faced5509460310fbd9902703f34f5c4f0ea9` 创建，供逐项审查。`index.html` 是完整的双端演示，包含学生端、机构端、虚构数据及原有内联图片。

- 分支：`gpt-fix`
- 完整源码：[`_src/`](./_src/)
- [逐项修复与验证说明](./_src/修复交付-v1.19.2-gpt.md)
- [验证日志与截图](./_src/验证记录/)
- [与基线对比](https://github.com/bardayu-cpu/lingyu-demo-test-1/compare/forayu...gpt-fix)

## 本机打开与构建

可以直接用浏览器打开根目录的 `index.html`。构建只需要 Python 3，路径相对于源码所在目录：

```sh
cd _src
python3 机构端/build.py
python3 试用版外壳/build.py
```

第二条命令会更新根目录 `index.html`。机构端产物和试用版产物分别输出到对应目录；拆分测试页面输出到 `_src/build/trial_parts/`。

原审查包缺少的图片已从指定基线的内联内容中恢复，保存在 `_src/公共图片/`。恢复脚本为 `_src/restore_assets.py`。构建没有 `/home/claude/v13/` 依赖。

## 自动测试

验证环境：Python 3.9、Playwright 1.60、Chrome，视口 1440 × 1000。

```sh
python3 -m venv .venv
.venv/bin/pip install playwright==1.60.0
.venv/bin/python -m playwright install chromium
.venv/bin/python _src/自动测试/run.py
```

默认运行 `adm19.py`、`stu19.py`、`trial_v119.py`；可在命令后加其他脚本名。也可通过 `CHROMIUM_PATH` 指定浏览器可执行文件，通过 `ADM_HTML`、`STU_HTML`、`TRIAL_HTML` 指定产物。日志输出到 `_src/build/test-results/`，任意断言或脚本异常都会返回失败。

## 本次确认的产品口径

学院额度采用用户确认的方案 6.4：邀约卡照常发送；完成预咨询后，按学院额度和真实可用时段开放人工预约入口。调整额度不撤回已有安排。所有预约仍需老师确认。

本分支保留固定的演示日期，并在两端工具栏明确标出。演示数据全部为虚构。
