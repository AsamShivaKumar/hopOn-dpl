import "../styles/fileUpload.css";

export default function FileUpload(props){

    return (
        <div className="fileUpload">
            <i className="fi fi-sr-arrow-circle-left" onClick={props.back}></i>
            <div className="uploadDiv">
                { props.doc !== "Profile Photo" && <h1>Upload a photo of your {props.doc}</h1> }
                { props.doc === "Profile Photo" && <h1>Upload your {props.doc}</h1> }
                <p className="instr">{props.instr}</p>
                {/* <div className="doc_div">
                    <img src = {process.env.PUBLIC_URL + "/docs/" + props.url} />
                </div> */}
                <label htmlFor="doc"> Upload </label>
                <input id = "doc" type="file" accept=".jpeg, .jpg, .png" hidden onChange = {props.handleChange}/>
            </div>             
        </div>
    )
}