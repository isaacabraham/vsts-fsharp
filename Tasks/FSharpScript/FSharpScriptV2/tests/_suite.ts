import * as path from 'path';
import * as assert from 'assert';
import * as ttm from 'azure-pipelines-task-lib/mock-test';

describe('Visual Studio bundled fsi.exe test', function () {

    before( function() {

    });

    after(() => {

    });

    it('should succeed valid fshparp script', function(done: MochaDone) {
        this.timeout(1000);
        
        // Add success test here
        let tp = path.join(__dirname,'visualStudio.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        
        tr.run();
        debugger;
        console.log(tr.succeeded);
        assert.equal(tr.succeeded, true, 'should have succeeded');
        assert.equal(tr.invokedToolCount, 1);
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 0, "should have no errors");
        done();
    });
});

describe('Microsoft sdk fsi.exe test', function () {

    before( function() {

    });

    after(() => {

    });

    it('should succeed valid fshparp script', function(done: MochaDone) {
        this.timeout(1000);
        
        // Add success test here
        let tp = path.join(__dirname,'microsoftSdk.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        
        tr.run();
        debugger;
        console.log(tr.succeeded);
        assert.equal(tr.succeeded, true, 'should have succeeded');
        assert.equal(tr.invokedToolCount, 1);
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 0, "should have no errors");
        done();
    });
});


describe('Custom path fsi.exe test', function () {

    before( function() {

    });

    after(() => {

    });

    it('should succeed valid fshparp script', function(done: MochaDone) {
        this.timeout(1000);
        
        // Add success test here
        let tp = path.join(__dirname,'customPath.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        
        tr.run();
        debugger;
        console.log(tr.succeeded);
        assert.equal(tr.succeeded, true, 'should have succeeded');
        assert.equal(tr.invokedToolCount, 1);
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 0, "should have no errors");
        done();
    });
});