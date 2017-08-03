# The Future of Work Jobs and Wages Scatterplot

To generate new data...

1) Get a new CSV-formatted datafile from Jed. It will probably be named `indeed_bls_data.csv`.

2) Open it in Excel and save it in the `/admin` directory as a .xlsx file. (The parsing script uses a xlsx parser. Don't ask me why. The short answer is I'm lazy.) Make sure to add the date to it to distinguish it from previous source data files. For example: `indeed_bls_data_7-10-2017.xlsx`

3) Open the `/admin/scatterplotJson.js` file. Rename the target file within the async() call to reflect your updated source data Excel file (the file created in step 2)

4) Navigate to the project's `/admin` folder in the terminal and run `node scatterplotJson.js`.

This will write over the `industryLookup.json` and `monthsData.json` files in the `/src/data` directory. You should see your changes reflected in the interactive on reload (namely, you'll the scrubber shows one more month of data than it did before).

5) Miller time!



