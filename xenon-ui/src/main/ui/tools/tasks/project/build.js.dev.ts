import * as gulp from 'gulp';
import * as gulpLoadPlugins from 'gulp-load-plugins';
import * as merge from 'merge-stream';
import * as util from 'gulp-util';
import { join/*, sep, relative*/ } from 'path';

import Config from '../../config';
import { makeTsProject, templateLocals } from '../../utils';
import { TypeScriptTask } from '../typescript_task';

const plugins = <any>gulpLoadPlugins();

const jsonSystemConfig = JSON.stringify(Config.SYSTEM_CONFIG_DEV);

/**
 * Executes the build process, transpiling the TypeScript files (except the spec and e2e-spec files) for the development
 * environment.
 */
export =
    class BuildJsDev extends TypeScriptTask {
        run() {
            let tsProject: any;
            let typings = gulp.src([
                Config.TOOLS_DIR + '/manual_typings/**/*.d.ts'
            ]);
            let src = [
                join(Config.APP_SRC, '**/*.ts'),
                '!' + join(Config.APP_SRC, '**/*.spec.ts'),
                '!' + join(Config.APP_SRC, '**/*.e2e-spec.ts'),
                '!' + join(Config.APP_SRC, `**/${Config.NG_FACTORY_FILE}.ts`)
            ];

            let projectFiles = gulp.src(src);
            let result: any;

            tsProject = makeTsProject();
            projectFiles = merge(typings, projectFiles);

            result = projectFiles
                .pipe(plugins.plumber())
                .pipe(plugins.sourcemaps.init())
                .pipe(tsProject())
                .on('error', (e: any) => {
                    util.log(util.colors.red(e.message));
                });

            return result.js
                .pipe(plugins.sourcemaps.write())
                // Use for debugging with Webstorm/IntelliJ
                // https://github.com/mgechev/angular-seed/issues/1220
                //    .pipe(plugins.sourcemaps.write('.', {
                //      includeContent: false,
                //      sourceRoot: (file: any) =>
                //        relative(file.path, PROJECT_ROOT + '/' + APP_SRC).replace(sep, '/') + '/' + APP_SRC
                //    }))
                .pipe(plugins.template(Object.assign(
                    templateLocals(), {
                        SYSTEM_CONFIG_DEV: jsonSystemConfig
                    }
                )))
                .pipe(gulp.dest(Config.APP_DEST));
        }
    };
