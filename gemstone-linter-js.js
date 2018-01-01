/*
**  GemstoneJS -- Gemstone JavaScript Technology Stack
**  Copyright (c) 2016-2018 Gemstone Project <http://gemstonejs.com>
**  Licensed under Apache License 2.0 <https://spdx.org/licenses/Apache-2.0>
*/

/*  load external requirements  */
const path      = require("path")
const ESLint    = require("eslint")

/*  exported API function  */
module.exports = async function (filenames, opts = {}, report = { sources: {}, findings: [] }) {
    /*  setup ESLint CLI engine  */
    let rules = {}
    if (opts.env === "development")
        rules["no-console"] = "off"
    Object.assign(rules, opts.rules)
    let engine = new ESLint.CLIEngine({
        useEslintrc: false,
        configFile:  require.resolve("gemstone-config-eslint/eslint.yaml"),
        rules:       rules
    })

    /*  interate over all source files  */
    let passed = true
    if (typeof opts.progress === "function")
        opts.progress(0.0, "linting JS: starting")
    for (let i = 0; i < filenames.length; i++) {
        /*  indicate progress  */
        if (typeof opts.progress === "function")
            opts.progress(i / filenames.length, `linting JS: ${filenames[i]}`)

        /*  execute ESLint on given source file  */
        let result = engine.executeOnFiles([ filenames[i] ])

        /*  report linting results  */
        if (result.errorCount > 0 || result.warningCount > 0) {
            passed = false
            result.results.forEach((file) => {
                let filename = path.relative(process.cwd(), file.filePath)
                report.sources[filename] = file.source
                file.messages.forEach((msg) => {
                    let [ ruleProc, ruleId ] = [ "eslint", msg.ruleId ]
                    let message = msg.message
                    if (ruleId === null && message.match(/^Parsing error:/)) {
                        message = message.replace(/\n(?:.|\n)*$/, "")
                        ruleProc = "eslint-babel"
                        ruleId   = "*"
                    }
                    report.findings.push({
                        ctx:      "JS",
                        filename: filename,
                        line:     msg.line,
                        column:   msg.column,
                        message:  message,
                        ruleProc: ruleProc,
                        ruleId:   ruleId
                    })
                })
            })
        }
    }
    if (typeof opts.progress === "function")
        opts.progress(1.0, "")
    return passed
}

