These files go in my user folder.

See also:

http://serverfault.com/questions/194567/how-to-i-tell-git-for-windows-where-to-find-my-private-rsa-key
=>
After you have the home directory, and a .ssh folder under that, you want to open PuTTYgen and open the key (.ppk file) you have previously created. Once your key is open, you want to select Conversions -> Export OpenSSH key and save it to HOME\.ssh\id_rsa. After you have the key at that location, Git bash will recognize the key and use it]