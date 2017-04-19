/* @flow */
import GerritChangesData from './GerritChangesData';
import UserStats from './UserStats';

class GerritUsersStatsBuilder {
    users: Map<string, UserStats>;

    constructor() {
        this.users = new Map();
    }

    build(gdata: GerritChangesData) {
        const getOrCreateUser = (users: any, username: any): UserStats => {
            if (!users.has(username)) {
                users.set(username, new UserStats(username));
            }
            return users.get(username);
        };

        // Scan events (comments)
        gdata.getEvents().forEach((e) => {
            getOrCreateUser(this.users, e.username).acceptEvent(e);
        });

        // Scan changesets
        gdata.getChangesets().forEach((c) => {
            getOrCreateUser(this.users, c.owner).acceptChangeset(c);
        });
    }

    getUsers() { return this.users; }

    getUsersStats() {
        let s = UserStats.getCSVHeader();
        this.users.forEach((userStats: UserStats, key: string, map) => {
            s += userStats.toCSVString();
        });
        return s;
    }

    saveUsersStats() {
        const fs = require('fs');
        fs.writeFileSync('usersStats.csv', this.getUsersStats());
    }
}

export default GerritUsersStatsBuilder;