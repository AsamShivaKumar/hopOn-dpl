// driver gets directed to this page if he is unverified or has to upload the documents

import {useState,useEffect} from "react"
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie"
import axios from "axios";
import FileUpload from "../components/FileUpload";
import "../styles/verification.css"

function Verification(){

    // const {cookies, setCookie} = useCookies();
    // const driver_data = cookies.driver
    // const name = driver_data.name
    // const docs = driver_data.docs


    const name = "Arjun";
    const docs = ["Profile Photo","Registration Certificate (RC)","Driving License","PAN CARD","Vehicle Insurance","Vehicle Permit"];
    const [submitted,setSubmitted] = useState([]);
    const [submit,setSubmit] = useState([]);
    const status = ["Verified","In review","Get started","Coudn't accept your document - Submit again!"]; // status of the documents

    const instructions = ["Your profile photo helps people recognize you. Please note that once you submit your profile photo it cannot be changed.",
    "1. Upload backside of Driving Licence first if some information is present on backside before the front side upload 2. Make sure that your driver license validates the class of vehicle you are choosing to drive in HopOn 3. Make sure License number, Driving License Type, your Address, Father's Name, D.O.B, Expiration Date and Govt logo on the License are clearly visible and the photo is not blurred",
    "If the vehicle owner name on the vehicle documents is different from mine, then I hereby confirm that I have the vehicle owner's consent to drive this vehicle on the HopOn Platform. This declaration can be treated as a No-Objection Certificate and releases HopOn from any legal obligations and consequences.",
    "Please upload the document by taking a picture",
    "Make sure photo is not blurred and these details are clearly visible - Model, Vehicle number, Chasis number, Registration Name, Start Date, Expiry Date, Financier name or Company name. You may need to submit additional photos if your document has multiple pages or sides or if first image was not clear.",
    "If the vehicle owner name on the vehicle documents is different from mine, then I hereby confirm that I have the vehicle owner's consent to drive this vehicle on the HopOn Platform. This declaration can be treated as a No-Objection Certificate and releases HopnOn from any legal obligations and consequences."];
    // const imageUrl = ["profile.png","license.png","rc.png","pan.png","vi.png","vp.png"];


    const navigate = useNavigate();
    const [fileUpload,displayFileUpload] = useState(false);
    const [bg,setBg] = useState("show");
    const [scale,setScale] = useState("upScale");
    const [doc,setDoc] = useState("Profile Photo");
    const [insrt,setInsrt] = useState(instructions[0]);
    const [url,setUrl] = useState("profile.jpg");
    const [image,setImage] = useState(null);    
    
    useEffect(() => {
        
        axios.post("/fetch-driver-details", {
            username: name
        })
        .then(res => {
            const driver = res.data.driver_data;
            const docStatus = driver.docs;
            const subDocs = [];
            const sDocs = [];
            
            for(var i = 0; i < docStatus.length; i++){
                if(docStatus[i] === 2 || docStatus[i] === 3) subDocs.push([docs[i],docStatus[i]]);
                else sDocs.push([docs[i],docStatus[i]]);
            }
            setSubmitted(sDocs);
            setSubmit(subDocs);
        });

        // redirect the driver to drive page once verification is done
        // if(cookies.driver.verified == true) navigate("/drive");       
    },[]);

    function displayUploadDiv(evt){
        const docu = evt.target.getAttribute("doc");
        setDoc(docu);
        const i = docs.indexOf(docu);
        setInsrt(instructions[i]);
        // setUrl(imageUrl[i]);
        displayFileUpload(true);
        setBg("hide");
        setScale("downScale");
    }

    function back(){
        displayFileUpload(false);
        setBg("show");
        setScale("upScale");
    }

    function uploadDoc(evt){

        const reader = new FileReader();
        reader.readAsDataURL(evt.target.files[0]);

        reader.onload = () => {
            // uploading file
            axios.post("/upload_file",{
                username: name,
                image: reader.result,
                docInd: docs.indexOf(doc)
            })
            .then(res => {
                if(res.data.success === true){
                    setSubmit( (prev) => {
                        return prev.filter( (ele) => (ele[0] !== doc));
                    });
                    setSubmitted((prev) => ([...prev,[doc,1]]));
                    back();
                }else{
                    setInsrt("Couldn't upload the document. Please try again!");
                }
            });
        }     
    }

    return (
        <>
            <div className="content" style={{ 
                backgroundImage: `url(${process.env.PUBLIC_URL + '/bg.jpg'})`,
                backgroundRepeat: 'no-repeat'
            }}>
               <div className={"mainDiv " + scale}>
                    <h1>Welcome, {name}</h1>
                    <p className="headline"> Here's what you need to do to set up your account.</p>
                    <div className="docs">
                         <div className="toSubmit">
                            <p>Submit these documents</p>

                            <div className="docDiv">
                                { submit.map( (doc) => {
                                    return (<div className="doc" key = {doc[0]}>
                                                <i className="fi fi-ss-document"></i>
                                                <div className="textDiv">
                                                <div>
                                                    <p className="top">{doc[0]}</p>
                                                    {doc[1] === 3 && <p className="btm" style = {{color: "red", fontWeight: 'bold'}}>{status[doc[1]]}</p>}
                                                    {doc[1] !== 3 && <p className="btm">{status[doc[1]]}</p>}
                                                </div>
                                                <i className="fi fi-ss-angle-right" doc = {doc[0]} onClick = { (evt) => (displayUploadDiv(evt)) }></i>
                                                </div>
                                            </div>);
                                })}
                            </div>
                         </div>
                         {submitted.length > 0 && <div className="submitted">
                            <p>Submitted documents</p>
                            <div className="docDiv">
                                { submitted.map( (doc) => {
                                    return (<div className="doc" key = {doc[0]}>
                                                    <i className="fi fi-ss-document"></i>
                                                    <div className="textDiv">
                                                    <div>
                                                        <p className="top">{doc[0]}</p>
                                                        { doc[0] !== "Profile Photo" && <p className="btm">{status[doc[1]]}</p>}
                                                    </div>
                                                    { doc[1] === 0 && <i className="fi fi-ss-badge-check"></i>}
                                                    { doc[1] === 1 && <i className="fi fi-sr-clock-three"></i>}
                                                    </div>
                                                </div>);
                                })} 
                            </div>
                         </div>}
                    </div>
               </div>
               { fileUpload && <FileUpload back = {back} doc = {doc} instr = {insrt} url = {url} handleChange = {(evt) => (uploadDoc(evt))}/>}
               <div className={"bgDiv " + bg}></div>
            </div>
        </>
    )
}

export default Verification;