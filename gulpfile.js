const { src, dest, watch, parallel, series } = require('gulp');

const nunjucks = require('gulp-nunjucks');
const sass = require('gulp-sass')(require('sass'));
const rename = require('gulp-rename');
const eslint = require('gulp-eslint');
const browserify = require('gulp-browserify');
const uglify = require('gulp-uglify');
const sync = require('browser-sync').create();

function generateCSS(cb) {
  return src('src/styles/style.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('public/css'))
    .pipe(sync.stream());
}

function generateHTML(cb) {
  return src(['src/htmls/index.njk'])
    .pipe(nunjucks.compile())
    .pipe(dest('public'))
    .pipe(sync.stream());
}

function generateScripts(cb) {
  return src('src/scripts/app.js')
    .pipe(
      browserify({
        insertGlobals: true
      })
    )
    .pipe(rename('app.js'))
    .pipe(dest('public/scripts'))
    .pipe(sync.stream());
}

function runLinter(cb) {
  return src(['src/scripts/**/*.js', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

function runUglify(cb) {
  return src('public/scripts/app.js')
    .pipe(uglify())
    .pipe(rename('app.min.js'))
    .pipe(dest('public/scripts'));
}

function watchFiles() {
  watch('src/htmls/**/*.njk', generateHTML);
  watch('src/styles/**/*.scss', generateCSS);
  watch(
    ['src/scripts/**/*.js', '!node_modules/**'],
    parallel(runLinter, generateScripts)
  );
}

function reloadBrowser() {
  sync.reload();
}

function browserSync() {
  sync.init({
    server: './public'
  });

  watchFiles();
}

exports.html = generateHTML;
exports.css = generateCSS;
exports.lint = runLinter;
exports.scripts = generateScripts;
exports.watch = watchFiles;
exports.dev = browserSync;

exports.build = series(generateHTML, generateCSS, generateScripts, runUglify);

exports.default = series(
  runLinter,
  parallel(generateHTML, generateCSS, generateScripts)
);
