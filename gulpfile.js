"use strict";

var autoprefixer = require("autoprefixer");
var browserSync = require("browser-sync").create();
var del = require("del");
var gulp = require("gulp");
var csso = require("gulp-csso");
var fileinclude = require("gulp-file-include");
var htmlmin = require('gulp-htmlmin');
var imagemin = require("gulp-imagemin");
var plumber = require("gulp-plumber");
var postcss = require("gulp-postcss");
var rename = require("gulp-rename");
var sass = require("gulp-sass");
var svgstore = require("gulp-svgstore");
var uglify = require("gulp-uglify");
var webp = require("gulp-webp");
var imageminJpegRecompress = require("imagemin-jpeg-recompress");
var pump = require("pump");
var run = require("run-sequence");
var cheerio = require('gulp-cheerio');

var path = {
  build: { //Тут мы укажем куда складывать готовые после сборки файлы
      html: 'build/',
      js: 'build/js/',
      script : 'build/js/script.min.js',
      css: 'build/css/',
      img: 'build/img/',
      fonts: 'build/fonts/',
      noMin: 'build/without_minification'
  },
  src: { //Пути откуда брать исходники
      html: '*.html', //Синтаксис src/*.html говорит gulp что мы хотим взять все файлы с расширением .html
      js: 'js/script.js',//В стилях и скриптах нам понадобятся только main файлы
      style: 'sass/style.scss',
      img: 'img/**/*.*', //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
      imgsprite : 'img/**/sprite-*.svg', //файлы для svg спрайтов
      fonts: 'fonts/**/*.*'
  },
  watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
      html: './**/*.html',
      js: 'js/**/*.js',
      style: "sass/**/*.{scss,sass}",
      img: 'img/**/*.*',
      fonts: 'fonts/**/*.*'
  },
  site: "./build" // Папка для сервера
};

gulp.task("server", function() {
  browserSync.init({
    server: path.site,
    index: 'index.html',
    notify: false,
    open: true,
    cors: true,
    ui: false,
    browser: "firefox",
    tunnel: true //тунель для теста сайта
  });

  gulp.watch(path.watch.style, ["style"]);
  gulp.watch(path.watch.html, ["html"]);
  gulp.watch(path.watch.js, ["js", "compressjs"]).on("change", browserSync.reload);
  gulp.watch(path.watch.img, ["copy"]).on("change", browserSync.reload);
});


gulp.task("html", function(){
  return gulp.src(path.src.html)
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest(path.build.noMin))
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(path.build.html))
    .pipe(browserSync.stream());
})

gulp.task("compressjs", function (done) {
  pump([
        gulp.src(path.build.script),
        gulp.src(path.build.noMin),
        uglify(),
        gulp.dest(path.build.js)
    ],
    done
  );
});

gulp.task("style", function() {
  gulp.src(path.src.style)
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(gulp.dest(path.build.noMin))
    .pipe(csso())
    .pipe(gulp.dest(path.build.css))
    .pipe(browserSync.stream());
});

gulp.task("sprite", function(){
  return gulp.src(path.src.imgsprite)
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest(path.build.img));
})

gulp.task("copy", function(){
  return gulp.src([
    path.src.fonts,
    path.src.img
  ], {
    base: "."
  })
  .pipe(gulp.dest(path.site));
})

gulp.task("clean", function(){
  return del(path.site);
})

gulp.task("images", function() {
  return gulp.src(path.src.img)
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imageminJpegRecompress({
        loops: 5,
        min: 70,
        max: 80,
        quality:'medium',
        progressive: true
      }),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest(path.build.img));
});

gulp.task("build", function(done) {
  run(
    "clean",
    "copy",
    "compressjs",
    "style",
    "sprite",
    "html",
    done
  );
});