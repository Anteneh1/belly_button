#Import Dependencies
from flask import Flask, jsonify, render_template
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, desc
import os
import pandas as pd
import numpy as np
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import scoped_session
#sessionmaker(bind=create_engine(classes.db_url, poolclass=NullPool))
#session = scoped_session()


#Initialize Flask
app = Flask(__name__)

#Initializes databse connection

engine = create_engine("sqlite:///bellybutton.sqlite")
#app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///bellybutton.sqlite"
#db = SQLAlchemy(app)

Base = automap_base()
Base.prepare(engine, reflect=True)

#Otu = Baspython e.classes.otu
Samples = Base.classes.samples
#Samples_metadata = Base.classes.samples_metadata
Sample_metadata = Base.classes.sample_metadata

#Creates Session
session = Session(engine)
#session = scoped_session(engine)

#Creates the dashboard home route (renders HTML template)
@app.route("/")
def home():
    """Return the dashboard homepage"""
    return render_template("index.html")

#Creates the list of sample names in the format ["BB_940" etc.]
@app.route("/names")
def names():
    """List of sample names.
    Returns a list of sample names in the format
    [
        "940",
        "941",
        "943",
        "944",
        "945",
        "946",
        "947",
        ...
    ]
    """
    samples = Samples.__table__.columns
    samples_list = [sample.key for sample in samples]
    samples_list.remove("otu_id")
    samples_list.remove("otu_label")

    return jsonify(samples_list)

#Returns a list of OTU (Operational Taxonomy Units) descriptions
@app.route("/otu")
def otu():
    otu_descriptions_list = []
    """List of OTU descriptions.
    Returns a list of OTU descriptions in the following format
    [
        "Archaea;Euryarchaeota;Halobacteria;Halobacteriales;Halobacteriaceae;Halococcus",
        "Archaea;Euryarchaeota;Halobacteria;Halobacteriales;Halobacteriaceae;Halococcus",
        "Bacteria",
        "Bacteria",
        "Bacteria",
        ...
    ]
    """
    #otu_descriptions = session.query(Otu.lowest_taxonomic_unit_found).all()
    #otu_descriptions_list = [x for (x), in otu_descriptions]
    stmt = session.query(Samples).statement
    df = pd.read_sql_query(stmt, session.bind)
    for otu_descriptions in df['otu_label']:
        otu_descriptions_list.append(otu_descriptions)

    return jsonify(otu_descriptions_list)

#Returns a json dictionary of sample metadata for a given sample.
@app.route("/metadata/<sample>")
def sample_query(sample):
    """ for a given 'sample' and changed value """
    myresulting = session.query(Sample_metadata.sample,
        Sample_metadata.ETHNICITY,
        Sample_metadata.GENDER,
        Sample_metadata.AGE,
        Sample_metadata.LOCATION,
        Sample_metadata.BBTYPE
        ).filter(Sample_metadata.sample == sample).all()
    # create a dictionary entry
    sample_dict = {}
    for result in myresulting:
        sample_dict["sample"] = result[0]
        sample_dict["ETHNICITY"] = result[1]
        sample_dict["GENDER"] = result[2]
        sample_dict["AGE"] = result[3]
        sample_dict["LOCATION"] = result[4]
        sample_dict["BBTYPE"] = result[5]
        

    return jsonify(sample_dict)

#Returns the weekly washing frequency as a number.
@app.route("/wfreq/<sample>")
def wfrequency(sample):
    resulted = session.query(Sample_metadata.sample,
        Sample_metadata.WFREQ).filter(Sample_metadata.sample == sample ).all()

    #create a dictionary entry for wfreq
    wash_freq = {}
    for resulting in resulted:
        wash_freq["WFREQ"] = resulting[1]

    return jsonify(wash_freq)

#Returns a list of dictionaries of sorted lists containing OTU IDs and Sample Values for a given sample.
#The pandas Dataframe is sorted in Descending Order by Sample Value
@app.route("/samples/<sample>")
def samples(sample):
    stmt = session.query(Samples).statement
    df = pd.read_sql_query(stmt, session.bind)
    
   # result = df.loc[df[sample] > 1, ["otu_id", "otu_label", 'sample]]
    result = df.loc[df[sample] > 1, ["otu_id", "otu_label", sample]]
    dict_list = {
        "otu_ids": result.otu_id.values.tolist(),
        "sample_values": result[sample].values.tolist(),
        "otu_labels": result.otu_label.tolist(),
    }
    return jsonify(dict_list)

#This part executes the flask app

if __name__ == '__main__':
    app.run(debug=True)