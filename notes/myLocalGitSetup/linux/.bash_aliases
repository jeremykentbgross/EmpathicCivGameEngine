#git helpers:
alias gitDirty='git status -s | grep "^\s*M\s*" | sed "s/^\s*M\s*//g"'
alias gitDeleted='git status -s | grep "^\s*D\s*" | sed "s/^\s*D\s*//g"'
alias gitAdded='git status -s | grep "^\s*A\s*" | sed "s/^\s*A\s*//g"'
alias gitUntracked='git status -s | grep "^\s*??\s*" | sed "s/^\s*??\s*//g"'
alias gitDiffNoTool='git diff --no-ext-diff'

#ignore files:
alias ignoreUsual='grep -v node_modules | grep -v "\.git" | grep -v 3rdParty | grep -v notes'

#tree helpers:
alias treeSafe='tree -a -I ".git|node_modules"'
alias treeSafeFollow='tree -a -l -I ".git|node_modules"'

#find helpers:
alias findJS='find . -name "*.js" | ignoreUsual'
alias findJSFollow='find . -name "*.js" -follow | ignoreUsual'
alias findSH='find . -name "*.sh" | ignoreUsual'
alias findAutoBackup='find . -name "*~" | ignoreUsual'
alias findFiles='find . -type f | ignoreUsual'
alias findDirectories='find . -type d | ignoreUsual'
alias findFilesErrors='findFiles | xargs file | grep ERROR'
alias findFilesText='findFiles | xargs file | grep -v ERROR | grep "ASCII\|UTF-8" | sed "s/:.*//g"'
alias findFilesNonText='findFiles | xargs file | grep -v ERROR | grep -v "ASCII" | grep -v "UTF-8" | sed "s/:.*//g"'

#cleanup helpers:
alias rmAutoBackup='findAutoBackup | xargs rm'
alias rmNodeModules='find . -type d -name "node_modules" | xargs rm -rf'

#time
alias zuluTime='date -u --iso-8601=ns | sed "s/\+0000/Z/g" | sed "s/,\([0-9]\{3\}\)[0-9]*/\.\1/g"'
alias localTime='date --iso-8601=ns | sed "s/,\([0-9]\{3\}\)[0-9]*/\.\1/g"'
alias zuluTimeFilename='zuluTime | sed "s/:\|-\|\./_/g"'
alias localTimeFilename='localTime | sed "s/:\|-\|\./_/g" | sed "s/.\{5\}$//g"'

#######################################################
######################Local only:######################
#turn my touch pad on/off with 1/0
alias touchPad='xinput set-prop `xinput list | grep -i touchpad | sed "s/.*id=\([0-9]\+\).*/\1/"` "Device Enabled"'
alias touchPadOn='touchPad 1'
alias touchPadOff='touchPad 0'
######################Local only:######################
#######################################################


alias backupProjects='rm -rf ~/Projects/EmpathicCivGameEngine/docs/generated/*; rm ~/logs/ECGElogs/*; cd ~/Projects; rmNodeModules; rmAutoBackup; cd ~; tar -zcvf ~/Dropbox/Projects_`zuluTimeFilename`.tar.gz ~/Projects; ECGE_RunNpmInstall.sh'

#TESTING!!

#gitAll??:
#alias openDirty git status -s | sed 's/^...//' | xargs gedit &

#alias gitCleanDirty='gitDirty | xargs git checkout'
#alias gitCleanDeleted='gitDeleted | xargs git checkout'
#alias gitCleanAdded='gitAdded | xargs git reset'
#alias gitCleanUntracked='gitUntracked | xargs rm'
