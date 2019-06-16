import { Build, BuildResult, BuildStatus } from 'azure-devops-node-api/interfaces/BuildInterfaces';

import { IBuildSummary } from '../build-summary.interface';
import { IPipelineStatus } from '../pipeline-status.interface';

import { ICiStatusChecker } from './ci-status-checker.interface';

export class CiStatusChecker implements ICiStatusChecker {

    public builds: Build[] = [];

    private _reported = new Set<string>();

    public get summary(): { pull: IBuildSummary; merge: IBuildSummary } {

        const pull = { pass: [], fail: [], ongoing: [], other: [] } as IBuildSummary;
        const merge = { pass: [], fail: [], ongoing: [], other: [] } as IBuildSummary;

        for (const build of this.builds) {

            const stats = this.isPullRequestValidation(build) ? pull : merge;
            const { pass, fail, ongoing, other } = stats;

            if (this.isPassedOrFailed(build)) {

                (this.isPassed(build) ? pass : fail).push(build);
            }
            else {

                (this.isBuilding(build) ? ongoing : other).push(build);
            }
        }

        return { pull, merge };
    }

    public brokenCheck(): IPipelineStatus<{ total: number; time: number }> | null {

        return null;
    }

    public buildingCheck(): IPipelineStatus<{ total: number; time: number }> | null {

        const builds = this.builds.filter(_ => this.isBuilding(_));
        const total = builds.length;

        if (!total) {

            return null;
        }

        const earliest = this.sortByStartTime(builds, true)[0];
        const time = this.elapsedSince(earliest.startTime);

        return { event: 'ci', mode: 'building', data: { total, time } };
    }

    public builtCheck(): IPipelineStatus<{ branch: string }> | null {

        const build = this.getLatestCompletedBuild();

        if (!build || !this.canReport(build) || !this.isPassedOrFailed(build)) {

            return null;
        }

        const branch = this.getSourceBranch(build).toUpperCase();
        this._reported.add(this.getKey(build));

        return { event: 'ci', mode: 'built', data: { branch } };
    }

    public failedCheck(): IPipelineStatus<{ branch: string }> | null {

        const build = this.getLatestCompletedBuild();

        if (!build || !this.canReport(build) || !this.isPassedOrFailed(build)) {

            return null;
        }

        const branch = this.getSourceBranch(build).toUpperCase();
        this._reported.add(this.getKey(build));

        return { event: 'ci', mode: 'build-failed', data: { branch } };
    }

    private canReport(build: Build, threshold = 60000): boolean {

        if (this._reported.has(this.getKey(build))) {

            return false;
        }

        return this.elapsedSince(build.finishTime) <= threshold;
    }

    private getKey(build: Build): string {

        const name = build.definition ? build.definition.name : '';

        return `${name}|${build.id}`;
    }

    private getLatestCompletedBuild(): Build | null {

        const builds = this.getCompletedBuilds();

        return builds.length ? this.sortByCompletionTime(builds)[0] : null;
    }

    private getCompletedBuilds(): Build[] {

        return this.builds.filter(_ => this.isCompleted(_));
    }

    private getSourceBranch(build: Build): string {

        if (this.isPullRequestValidation(build)) {

            return build.triggerInfo ? build.triggerInfo['pr.sourceBranch'] : '';
        }

        const paths = (build.sourceBranch || '').split('/');

        return paths[paths.length - 1];
    }

    private sortByCompletionTime(builds: Build[], ascending = false): Build[] {

        const sorted = builds.slice().sort((a, b) => {

            const now = Date.now();
            const finishTimeA = a.finishTime ? a.finishTime.getTime() : now;
            const finishTimeB = b.finishTime ? b.finishTime.getTime() : now;

            return finishTimeB - finishTimeA;
        });

        return ascending ? sorted.reverse() : sorted;
    }

    private sortByStartTime(builds: Build[], ascending = false): Build[] {

        const sorted = builds.slice().sort((a, b) => {

            const now = Date.now();
            const startTimeA = a.startTime ? a.startTime.getTime() : now;
            const startTimeB = b.startTime ? b.startTime.getTime() : now;

            return startTimeB - startTimeA;
        });

        return ascending ? sorted.reverse() : sorted;
    }

    private elapsedSince(date = new Date()): number {

        return Date.now() - date.getTime();
    }

    private isPullRequestValidation(build: Build): boolean {

        return /^refs\/pull/.test(build.sourceBranch || '');
    }

    private isPassedOrFailed(build: Build): boolean {

        return this.isPassed(build) || this.isFailed(build);
    }

    private isPassed(build: Build): boolean {

        return build.result === BuildResult.Succeeded;
    }

    private isFailed(build: Build): boolean {

        if (build.result === BuildResult.Failed) {

            return true;
        }

        return build.result === BuildResult.PartiallySucceeded;
    }

    private isCompleted(build: Build): boolean {

        return build.status === BuildStatus.Completed;
    }

    private isBuilding(build: Build): boolean {

        return build.status === BuildStatus.InProgress;
    }
}
